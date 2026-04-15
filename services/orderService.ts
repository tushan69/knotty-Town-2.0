import { Order } from '../types';
import { apiUrl } from '../utils/apiUrl';
import { getAdminApiToken } from '../utils/adminToken';

const LOCAL_ORDERS_KEY = 'knotty_local_orders';
const API_URL = apiUrl('orders.php');

const getLocalOrders = (): any[] => {
  const local = localStorage.getItem(LOCAL_ORDERS_KEY);
  return local ? JSON.parse(local) : [];
};

export const saveOrder = async (order: Order): Promise<{ success: boolean; error?: string }> => {
  try {
    const local = getLocalOrders();
    localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([order, ...local]));
  } catch (e) {
    console.warn("Local storage save failed", e);
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

    console.log("Sending Order Payload:", JSON.stringify(order));

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      console.error("API Error Response:", errText);
      let errorMsg = `Server Error (${response.status})`;
      try {
        const errJson = JSON.parse(errText);
        if (errJson.error) errorMsg = errJson.error;
      } catch (e) {
        errorMsg = errText.substring(0, 100); // Limit length
      }
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (e: any) {
    console.error("API Error or Timeout", e);
    // Keep offline support: return true if it's a network error (saved locally)
    return { success: true };
  }
};


export interface OrderPagination {
  currentPage: number;
  totalPages: number;
  totalOrders: number;
  limit: number;
}

export interface OrdersResponse {
  orders: any[];
  pagination: OrderPagination;
}

export const getAllOrders = async (page: number = 1, limit: number = 50): Promise<OrdersResponse> => {
  let apiOrders: any[] = [];
  let pagination: OrderPagination = { currentPage: 1, totalPages: 1, totalOrders: 0, limit: 50 };

  try {
    const adminToken = getAdminApiToken();
    const response = await fetch(`${API_URL}?page=${page}&limit=${limit}`, {
      headers: { 'X-Admin-Token': adminToken }
    });

    if (response.ok) {
      const data = await response.json();
      // Check if response is paginated or legacy array
      if (Array.isArray(data)) {
        apiOrders = data;
        pagination.totalOrders = data.length;
      } else {
        apiOrders = data.orders || [];
        pagination = data.pagination || pagination;
      }
    }
  } catch (e) { console.error("API Fetch Error", e); }

  // Fallback / Merging logic for local orders (mostly for dev/offline)
  // Only merge local orders on the first page to avoid duplication across pages
  if (page === 1) {
    const localOrders = getLocalOrders();
    const orderMap = new Map();
    localOrders.forEach(o => orderMap.set(o.id, o));
    apiOrders.forEach(o => orderMap.set(o.id, o));

    const mergedOrders = Array.from(orderMap.values()).sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Update total count if local orders added more
    if (mergedOrders.length > pagination.totalOrders) {
      pagination.totalOrders = mergedOrders.length;
    }

    return {
      orders: mergedOrders.slice(0, limit),
      pagination: { ...pagination, totalOrders: Math.max(pagination.totalOrders, mergedOrders.length) }
    };
  }

  return { orders: apiOrders, pagination };
};

export const updateOrderStatus = async (id: string, status: string, payment_status?: string, payment_id?: string): Promise<boolean> => {
  const local = getLocalOrders();
  const updated = local.map(o => o.id === id ? { ...o, status, payment_status: payment_status || o.payment_status, payment_id: payment_id || o.payment_id } : o);
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(updated));

  try {
    const adminToken = getAdminApiToken();
    const response = await fetch(API_URL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Admin-Token': adminToken
      },
      body: JSON.stringify({ id, status, payment_status, payment_id })
    });
    return response.ok;
  } catch (e) {
    return true;
  }
};

export const deleteOrder = async (id: string): Promise<boolean> => {
  const local = getLocalOrders();
  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(local.filter(o => o.id !== id)));

  try {
    const adminToken = getAdminApiToken();
    const response = await fetch(`${API_URL}?id=${id}`, {
      method: 'DELETE',
      headers: { 'X-Admin-Token': adminToken }
    });
    return response.ok;
  } catch (e) {
    return true;
  }
};

export const trackOrder = async (id: string): Promise<any | null> => {
  try {
    const response = await fetch(`${API_URL}?id=${id}`);
    if (response.ok) {
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
    }
  } catch (e) { }

  const local = getLocalOrders();
  return local.find(o => o.id === id) || null;
};
