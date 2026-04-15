import React, { useState, useEffect, useRef } from 'react';
import {
  ShoppingCart, Zap, X, Upload, Settings, Grid, QrCode, Wifi, WifiOff, Edit2,
  Trash2, Eye, LogOut, Package, ExternalLink, User, Mail, Phone, MapPin,
  CreditCard, Tag, List, TrendingUp, BarChart3, Box, Activity, ChevronRight,
  ImageIcon, RefreshCw, Copy, FileText, Printer, Check, Download, ArrowLeft,
  Home as HomeIcon, Star, Crown, Percent, Sparkles, BrainCircuit, Barcode, ShieldCheck, Lock, Plus
} from 'lucide-react';
import { Order, Product, Category } from '../types';
import { getProducts, addProduct, deleteProduct, clearProductCache } from '../services/productService';
import { getAllOrders, updateOrderStatus, deleteOrder as apiDeleteOrder, trackOrder } from '../services/orderService';
// Fix: Removed 'getComplexReasoning' as it is not exported from geminiService and not used in this file.
import { analyzeSalesData, generateDescription } from '../services/geminiService';
import { generateInvoice, generateShippingLabel } from '../utils/pdfGenerator';
import { useCart } from '../context/CartContext';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useNavigate } from 'react-router-dom';
import { apiUrl } from '../utils/apiUrl';
import { getAdminApiToken } from '../utils/adminToken';

const ALL_SIZES = ['S', 'M', 'L', 'XL'];

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const styles: Record<string, string> = {
    'Pending': 'bg-[#f4ebe1] text-[#745b3b] border-[#e0d2c1]',
    'Shipped': 'bg-[#ebf0f2] text-[#4a5f6b] border-[#d1dee5]',
    'Delivered': 'bg-[#ecf2ef] text-[#2C362F] border-[#dce8e2]',
  };
  return (
    <span className={`px-4 py-1.5 border text-[9px] font-body uppercase tracking-[0.2em] italic ${styles[status] || styles['Pending']}`}>
      {status}
    </span>
  );
};

const StatCard: React.FC<{ icon: any, label: string, value: string, color: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-white border border-gray-200 p-6 shadow-sm transition-all flex items-center space-x-6">
    <div className={`p-4 border border-gray-200 ${color}`}>
      <Icon className="w-6 h-6 text-black" />
    </div>
    <div>
      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
      <p className="font-serif text-2xl uppercase tracking-tighter">{value}</p>
    </div>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stats' | 'inventory' | 'metals' | 'orders' | 'users' | 'settings' | 'recovery' | 'coupons'>('stats');
  const [abandonedCarts, setAbandonedCarts] = useState<any[]>([]);
  const [isSendingRecovery, setIsSendingRecovery] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

  const showToast = (message: string, type: 'success'|'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };
  // Auth state removed - handled by AdminRoute and AdminAuthContext
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [dbConnected, setDbConnected] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showAddPlate, setShowAddPlate] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // AI Analyst State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState<string | null>(null);
  const [razorpayStatus, setRazorpayStatus] = useState<any | null>(null);

  const frontFileInputRef = useRef<HTMLInputElement>(null);
  const backFileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);
  const brandingFileInputRef = useRef<HTMLInputElement>(null);
  const { shippingPrice, updateShippingPrice } = useCart();
  const [localShippingPrice, setLocalShippingPrice] = useState(shippingPrice);
  const [customQrImage, setCustomQrImage] = useState<string | null>(null);
  const [razorpayKey, setRazorpayKey] = useState<string>('');
  const [razorpaySecret, setRazorpaySecret] = useState<string>('');
  const [royalLionBranding, setRoyalLionBranding] = useState<string | null>(null);
  const [customPrice, setCustomPrice] = useState('1599'); // State for Custom Design Price
  const [vaultPasskey, setVaultPasskey] = useState('TOWNLEGEND');
  const [vaultMessage, setVaultMessage] = useState('');
  const [whatsappApiUrl, setWhatsappApiUrl] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappInstanceId, setWhatsappInstanceId] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [featuresInput, setFeaturesInput] = useState('');
  const [selectedSizes, setSelectedSizes] = useState<string[]>(ALL_SIZES);
  const [isSoldOutToggle, setIsSoldOutToggle] = useState(false);
  const [isFeaturedToggle, setIsFeaturedToggle] = useState(false);

  const INITIAL_NEW_PRODUCT: Partial<Product> = {
    name: '', price: 0, originalPrice: 0, category: Category.OVERSIZED, description: '', image: '', backImage: '', features: [], availableSizes: ALL_SIZES, isSoldOut: false, isFeatured: false
  };

  const [newProduct, setNewProduct] = useState<Partial<Product>>(INITIAL_NEW_PRODUCT);

  const { logout } = useAdminAuth();
  const navigate = useNavigate();



  const [dbError, setDbError] = useState<string | null>(null);
  const checkConnectivity = async () => {
    try {
      const res = await fetch(apiUrl('health.php'));
      const data = await res.json();
      if (data.status === 'ok') {
        setDbConnected(true);
        setDbError(null);
      } else {
        setDbConnected(false);
        setDbError(data.message || 'ENGINE FAILURE');
      }
    } catch (e: any) {
      setDbConnected(false);
      setDbError(e.message || 'NETWORK DISRUPTION');
    }
  };

  const handleVerifyRazorpay = async (paymentId: string) => {
    setVerifyingPayment(paymentId);
    setRazorpayStatus(null);
    try {
      const res = await fetch(apiUrl(`check_payment_status.php?payment_id=${paymentId}`), {
        headers: { 'X-Admin-Token': getAdminApiToken() },
      });
      const data = await res.json();
      if (data.status === 'success') {
        setRazorpayStatus(data.data);
      } else {
        showToast(data.message || "VERIFICATION FAILED", 'error');
      }
    } catch (e) {
      showToast("SIGNAL INTERRUPTED. TRY AGAIN.", 'error');
    } finally {
      setVerifyingPayment(null);
    }
  };

  const handleUpdateToPaid = async (orderId: string, paymentId: string) => {
    if (!confirm("CONFIRM MANUAL PAYMENT OVERRIDE?")) return;
    const success = await updateOrderStatus(orderId, (selectedOrder.status as any), 'PAID');
    if (success) {
      setSelectedOrder({ ...selectedOrder, payment_status: 'PAID', payment_id: paymentId });
      setOrders(orders.map(o => o.id === orderId ? { ...o, payment_status: 'PAID', payment_id: paymentId } : o));
      showToast("PAYMENT STATUS LOCKED TO PAID.");
    }
  };

  const fetchSettings = async () => {
    try {
      const res = await fetch(apiUrl('settings.php'), {
        headers: { 'X-Admin-Token': getAdminApiToken() },
      });
      const data = await res.json();
      if (data.shipping_price) setLocalShippingPrice(Number(data.shipping_price));
      if (data.qr_code_image) setCustomQrImage(data.qr_code_image);
      if (data.razorpay_key) setRazorpayKey(data.razorpay_key);
      if (data.razorpay_secret) setRazorpaySecret(data.razorpay_secret);
      if (data.royal_lion_branding) setRoyalLionBranding(data.royal_lion_branding);
      if (data.custom_design_price) setCustomPrice(data.custom_design_price);
      if (data.vault_passkey) setVaultPasskey(data.vault_passkey);
      if (data.vault_message) setVaultMessage(data.vault_message);
      if (data.whatsapp_api_url) setWhatsappApiUrl(data.whatsapp_api_url);
      if (data.whatsapp_token) setWhatsappToken(data.whatsapp_token);
      if (data.whatsapp_instance_id) setWhatsappInstanceId(data.whatsapp_instance_id);
    } catch (e) {
      console.error("Failed to load settings");
    }
  };

  const saveVaultSettings = async () => {
    setIsSavingSettings(true);
    try {

      const adminToken = getAdminApiToken();
      await Promise.all([
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'vault_passkey', value: vaultPasskey }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'vault_message', value: vaultMessage }) })
      ]);
      showToast("VAULT SECURITY PROTOCOLS UPDATED.");
    } catch (e) {
      showToast("FAILED TO SYNC VAULT.", 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Pagination State for Orders
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [itemsPerPage] = useState(50);

  // Pagination State for Products
  const [productPage, setProductPage] = useState(1);
  const [totalProductPages, setTotalProductPages] = useState(1);
  const [itemsPerProductPage] = useState(12);

  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponCount, setCouponCount] = useState(1);
  const [couponAmount, setCouponAmount] = useState('100'); // Default to 100 for 'self-generating' feel
  const [lastGenerated, setLastGenerated] = useState<string[]>([]);  
  const fetchCoupons = async () => {
    try {
      const res = await fetch(apiUrl('coupons.php?action=list'), { headers: { 'X-Admin-Token': getAdminApiToken() } });
      const data = await res.json();
      if (data.coupons) setCoupons(data.coupons);
    } catch(e) {}
  };

  const handleCreateCoupons = async () => {
    try {
      const res = await fetch(apiUrl('coupons.php?action=create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Token': getAdminApiToken() },
        body: JSON.stringify({ amount: Number(couponAmount), count: couponCount })
      });
      const data = await res.json();
      if (data.status === 'success') {
        showToast(`GENERATED ${couponCount} COUPON${couponCount > 1 ? 'S' : ''}.`);
        setLastGenerated(data.codes);
        // Keep couponAmount for repeated minting
        fetchCoupons();
      } else {
        const errMsg = data.error || data.message || (data.errors && data.errors[0]) || "FAILED";
        showToast(errMsg, 'error');
      }
    } catch(e: any) { showToast(e.message || "ERROR", 'error'); }
  };
  
  const handleDeleteCoupon = async (id: number) => {
    try {
      await fetch(apiUrl(`coupons.php?action=delete&id=${id}`), { method: 'DELETE', headers: { 'X-Admin-Token': getAdminApiToken() }});
      fetchCoupons();
      showToast("COUPON TRASHED.", 'success');
    } catch(e) {}
  };

  const loadData = async () => {
    // Orders
    const response = await getAllOrders(currentPage, itemsPerPage);
    if (Array.isArray(response)) {
      setOrders(response);
    } else {
      setOrders(response.orders || []);
      setTotalPages(response.pagination?.totalPages || 1);
    }
    
    // Products (Paginated)
    try {
      const prodRes = await fetch(apiUrl(`products.php?page=${productPage}&limit=${itemsPerProductPage}`));
      const prodData = await prodRes.json();
      
      if (Array.isArray(prodData)) {
        setProducts(prodData);
        setTotalProductPages(1);
      } else {
        setProducts(prodData.products || []);
        setTotalProductPages(prodData.pagination?.totalPages || 1);
      }
    } catch (e) {
      console.warn("Failed to load products from API. Fallback to cache.");
      const allProducts = await getProducts();
      setProducts(allProducts);
    }

    // Recovery
    try {
      const recoveryRes = await fetch(apiUrl('get_abandoned_carts.php'), {
        headers: { 'X-Admin-Token': getAdminApiToken() },
      });
      const recoveryData = await recoveryRes.json();
      if (Array.isArray(recoveryData)) setAbandonedCarts(recoveryData);
    } catch (e) {
      console.warn("Failed to load recovery data");
    }

    fetchCoupons();
  };

  useEffect(() => {
    loadData();
    checkConnectivity();
    fetchSettings();
  }, [currentPage, productPage]); // Reload when either page changes

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleProductPageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalProductPages) {
      setProductPage(newPage);
    }
  };

  const handleAutoWriteDescription = async (isPlate: boolean = false) => {
    const name = isPlate ? (editingProduct?.name || newProduct.name) : (editingProduct?.name || newProduct.name);
    const category = isPlate ? 'Metal Poster' : (editingProduct?.category || newProduct.category);
    
    if (!name) {
      showToast("NAME YOUR DROP FIRST.", 'error');
      return;
    }

    setToast({ message: "WRITING LORE...", type: 'success' });
    const description = await generateDescription(name || '', (category as string), featuresInput.split(','));
    
    if (editingProduct) {
      setEditingProduct({ ...editingProduct, description });
    } else {
      setNewProduct({ ...newProduct, description });
    }
    showToast("LORE UPDATED VIA AI.");
  };

  const handleSendRecovery = async (phone: string, name: string) => {
    setIsSendingRecovery(phone);
    try {
      const res = await fetch(apiUrl('send_recovery_wa.php'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Token': getAdminApiToken(),
        },
        body: JSON.stringify({ phone, name })
      });
      const data = await res.json();
      if (data.success) {
        showToast("NUDGE SENT VIA WHATSAPP.");
        loadData();
      } else {
        showToast("SIGNAL FAILED.", 'error');
      }
    } catch (e) {
      showToast("SYSTEM ERROR.", 'error');
    } finally {
      setIsSendingRecovery(null);
    }
  };

  const handleAnalyzeTrends = async () => {
    setIsAnalyzing(true);
    setAiReport('DECODING MARKET SIGNALS...');
    try {
      // Prepare context for AI - Analyzing current view for performance
      const ordersSummary = orders.map(o =>
        `Order ${o.id}: ₹${o.total} (${o.items.length} items) - Items: ${o.items.map((i: any) => `${i.name} (${i.selectedSize})`).join(', ')}`
      ).join('\n');

      const inventorySummary = products.map(p =>
        `${p.name} (${p.category}): ₹${p.price} - Stock: ${p.availableSizes?.join(', ')}`
      ).join('\n');

      const report = await analyzeSalesData(ordersSummary, inventorySummary);
      setAiReport(report);
    } catch (error) {
      setAiReport('SIGNAL LOST. RETRY ANALYSIS.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleViewOrder = async (id: string) => {
    const fullOrder = await trackOrder(id);
    if (fullOrder) setSelectedOrder(fullOrder);
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    const success = await updateOrderStatus(id, newStatus);
    if (success) loadData();
  };

  const handleDeleteOrder = async (id: string) => {
    if (window.confirm("CONFIRM DATA WIPEOUT?")) {
      const success = await apiDeleteOrder(id);
      if (success) {
        loadData();
        setSelectedOrder(null);
      }
    }
  };

  const handleCopyDetails = (order: any) => {
    const text = `
Order ID: ${order.id}
Customer: ${order.customer_name}
Phone: ${order.customer_phone}
Email: ${order.customer_email}
Address: ${order.address}, ${order.city}, ${order.pincode}
Total: ₹${order.total}
    `.trim();
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleUpdatePrice = async () => {
    const adminToken = getAdminApiToken();
    await fetch(apiUrl('settings.php'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken },
      body: JSON.stringify({ key: 'custom_design_price', value: customPrice })
    });
    showToast('Custom Design Price Updated!');
  };

  const formatOrderForPDF = (order: any): Order => {
    return {
      id: order.id,
      date: order.date,
      customer: {
        name: order.customer_name,
        email: order.customer_email || order.email,
        phone: order.customer_phone || order.phone,
        address: order.address,
        city: order.city,
        pincode: order.pincode
      },
      items: (order.items || []).map((item: any) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
        selectedSize: item.selected_size || item.selectedSize
      })),
      total: Number(order.total),
      status: order.status,
      paymentMethod: order.payment_method || order.paymentMethod || 'Manual UPI',
      shipping_price: order.shipping_price
    };
  };

  const handleDownloadInvoice = (order: any) => {
    const formattedOrder = formatOrderForPDF(order);
    generateInvoice(formattedOrder);
  };

  const handleQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setCustomQrImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBrandingUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setRoyalLionBranding(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    try {

      const adminToken = getAdminApiToken();
      await Promise.all([
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'qr_code_image', value: customQrImage }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'royal_lion_branding', value: royalLionBranding }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'razorpay_key', value: razorpayKey }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'razorpay_secret', value: razorpaySecret }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'whatsapp_api_url', value: whatsappApiUrl }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'whatsapp_token', value: whatsappToken }) }),
        fetch(apiUrl('settings.php'), { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Admin-Token': adminToken }, body: JSON.stringify({ key: 'whatsapp_instance_id', value: whatsappInstanceId }) })
      ]);

      updateShippingPrice(localShippingPrice);
      showToast("SYSTEM CONFIG UPDATED.");
    } catch (e) {
      showToast("SYNC ERROR.", 'error');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const val = reader.result as string;
        if (editingProduct) {
          setEditingProduct({ ...editingProduct, [side === 'front' ? 'image' : 'backImage']: val });
        } else {
          setNewProduct({ ...newProduct, [side === 'front' ? 'image' : 'backImage']: val });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const processedFeatures = featuresInput.split(',').map(f => f.trim()).filter(f => f !== '');

    const product: Product = {
      id: editingProduct ? editingProduct.id : 'kt-drop-' + Date.now(),
      name: (editingProduct?.name || newProduct.name) || 'Untitled Drop',
      price: Number(editingProduct ? editingProduct.price : newProduct.price) || 0,
      originalPrice: Number(editingProduct ? editingProduct.originalPrice : newProduct.originalPrice) || 0,
      category: (editingProduct?.category || newProduct.category) || Category.OVERSIZED,
      description: (editingProduct?.description || newProduct.description) || '',
      image: (editingProduct?.image || newProduct.image) || '',
      backImage: (editingProduct?.backImage || newProduct.backImage) || '',
      features: processedFeatures,
      availableSizes: selectedSizes,
      isSoldOut: isSoldOutToggle,
      isFeatured: isFeaturedToggle,
      rating: editingProduct?.rating ?? 5.0,
      reviews: editingProduct?.reviews ?? []
    };

    const success = await addProduct(product);
    if (!success) {
      showToast("CLOUD SYNC FAILED. PRODUCT SAVED LOCALLY ONLY.", 'error');
    }

    // Invalidate cache so users see the new/updated product immediately
    clearProductCache();

    // Always update UI since local storage acts as source of truth for display
    await loadData();
    setShowAddProduct(false);
    setEditingProduct(null);
    setNewProduct(INITIAL_NEW_PRODUCT);
    setFeaturesInput('');
  };

  const startEditProduct = (p: Product) => {
    setEditingProduct(p);
    setFeaturesInput(p.features ? p.features.join(', ') : '');
    setSelectedSizes(p.availableSizes || ALL_SIZES);
    setIsSoldOutToggle(p.isSoldOut || false);
    setIsFeaturedToggle(p.isFeatured || false);
    if (p.category === Category.METAL_POSTERS) {
      setShowAddPlate(true);
      setShowAddProduct(false);
    } else {
      setShowAddProduct(true);
      setShowAddPlate(false);
    }
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const frontPreview = editingProduct ? editingProduct.image : newProduct.image;
  const backPreview = editingProduct ? editingProduct.backImage : newProduct.backImage;

  useEffect(() => {
    loadData();
    checkConnectivity();
    fetchSettings();
  }, []);

  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col pb-24 lg:pb-0 print:bg-white print:p-0">
      {toast && (
        <div className={`fixed top-6 right-6 z-[9999] px-6 py-4 shadow-2xl border ${toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-black text-white border-black'} animate-in slide-in-from-top-4 flex items-center gap-4`}>
          {toast.type === 'error' ? <X className="w-5 h-5"/> : <Check className="w-5 h-5"/>}
          <span className="font-body text-[10px] uppercase tracking-widest">{toast.message}</span>
        </div>
      )}
      <aside className="w-80 bg-primary text-white hidden lg:flex flex-col border-r border-white/5 fixed h-full z-50 print:hidden shadow-2xl">
        <div className="p-12 border-b border-white/5">
          <span className="text-accent font-body text-[9px] tracking-[0.5em] uppercase mb-4 block opacity-60">Official Access</span>
          <h2 className="font-headline text-2xl italic tracking-tighter text-white">Knotty Atelier.</h2>
        </div>
        <nav className="flex-grow p-8 space-y-6">
          {[
            { id: 'orders', label: 'Orders Archive', icon: List },
            { id: 'products', label: 'Inventory Vault', icon: Grid },
            { id: 'plates', label: 'Metal Boutique', icon: ImageIcon },
            { id: 'recovery', label: 'Cart Recovery', icon: Zap },
            { id: 'settings', label: 'Studio Config', icon: Settings },
            { id: 'coupons', label: 'Coupons Control', icon: Tag },
            { id: 'vault', label: 'Secret Archives', icon: Lock }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center p-5 font-body text-[10px] uppercase tracking-[0.3em] transition-all duration-700 group ${activeTab === tab.id ? 'bg-white/5 text-accent translate-x-2' : 'text-white/40 hover:text-white'}`}
            >
              <tab.icon className={`w-4 h-4 mr-5 transition-colors ${activeTab === tab.id ? 'text-accent' : 'text-white/20 group-hover:text-white'}`} />
              <span className="flex-grow text-left">{tab.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-12 border-t border-white/5 opacity-20 hover:opacity-100 transition-opacity">
           <button onClick={() => { logout(); navigate('/admin/login'); }} className="flex items-center text-[9px] font-body uppercase tracking-[0.4em] text-white">
             <LogOut className="w-4 h-4 mr-4" /> Sign Out
           </button>
        </div>
      </aside>

      <main className="flex-grow lg:ml-72 relative min-h-screen flex flex-col pt-20 lg:pt-0 print:ml-0 print:pt-0">
        <div className="flex-grow p-8 md:p-16 lg:p-24 max-w-[1920px] mx-auto w-full">
          <header className="flex justify-between items-end mb-24 print:hidden">
            <div>
               <span className="text-accent font-body text-[11px] tracking-[0.5em] uppercase mb-4 block mix-blend-multiply opacity-60">Atelier Control Panel / {new Date().getFullYear()}</span>
               <h1 className="font-headline text-6xl md:text-8xl italic font-light tracking-tighter text-primary capitalize">
                 {activeTab === 'vault' ? 'Archives' : activeTab === 'plates' ? 'Plates' : activeTab}.
               </h1>
            </div>
            <div className="flex space-x-4">
              {activeTab === 'orders' && (
                <button
                  onClick={handleAnalyzeTrends}
                  disabled={isAnalyzing}
                  className="flex items-center space-x-3 bg-white text-black px-6 py-3 border border-gray-200 shadow-sm transition-all hover:bg-black text-white hover:bg-gray-800 hover:text-white transition-all"
                >
                  {isAnalyzing ? <Activity className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                  <span className="text-[10px] font-black uppercase">ANALYZE TRENDS</span>
                </button>
              )}
              <button onClick={() => {
                logout();
                navigate('/admin/login');
              }} className="text-[9px] font-black uppercase bg-black text-white px-6 py-3 border border-gray-200 shadow-sm transition-all">LOGOUT</button>
            </div>
          </header>

          {activeTab === 'orders' && (
            <div className="space-y-16 animate-in fade-in duration-500 print:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                <StatCard icon={BarChart3} label="Gross Revenue" value={`₹${orders.reduce((a, o) => a + (parseFloat(o.total) || 0), 0).toLocaleString()}`} color="bg-accent/10" />
                <StatCard icon={ShoppingCart} label="Curated Hauls" value={orders.length.toString()} color="bg-primary/5" />
                <StatCard icon={Box} label="Active Silhouette Drops" value={products.length.toString()} color="bg-primary/5" />
                <StatCard icon={Activity} label="Engine Status" value={dbConnected ? "OPERATIONAL" : (dbError ? `OFFLINE: ${dbError}` : "OFFLINE")} color={dbConnected ? "bg-green-50" : "bg-red-50"} />
              </div>

              {aiReport && (
                <div className="bg-black border border-gray-200 p-10 shadow-sm transition-all relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                    <Sparkles className="w-32 h-32 text-yellow-400" />
                  </div>
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-center">
                      <h3 className="font-serif text-3xl text-black uppercase italic">AI TREND REPORT.</h3>
                      <button onClick={() => setAiReport(null)} className="text-white/40 hover:text-white"><X className="w-6 h-6" /></button>
                    </div>
                    <div className="text-white/80 font-body text-[11px] uppercase tracking-[0.2em] leading-loose whitespace-pre-line border-l border-accent/40 pl-12">
                      {aiReport}
                    </div>
                    <div className="flex items-center space-x-3 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <Zap className="w-4 h-4 fill-current text-yellow-400" />
                      <span>ANALYZED VIA GEMINI 3 PRO ENGINE</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-gray-200 shadow-sm transition-all overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                  <thead className="bg-primary/5 text-primary text-[10px] font-body uppercase tracking-[0.3em]">
                    <tr>
                      <th className="p-8 font-light italic">Ref. ID</th>
                      <th className="p-8 font-light italic">Member</th>
                      <th className="p-8 font-light italic">Valuation</th>
                      <th className="p-8 font-light italic">Fulfillment</th>
                      <th className="p-8 font-light italic">Invoice</th>
                      <th className="p-8 font-light italic">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-gray-100">
                    {orders.map(o => (
                      <tr key={o.id} className="hover:bg-gray-50/20">
                        <td className="p-5 font-black text-[10px]">{o.id}</td>
                        <td className="p-5 font-black text-[11px] uppercase">{o.customer_name}</td>
                        <td className="p-5 font-serif text-black text-lg">₹{o.total}</td>
                        <td className="p-5"><StatusBadge status={o.status} /></td>
                        <td className="p-5">
                          <button onClick={() => handleDownloadInvoice(o)} className="flex items-center space-x-2 text-[9px] font-black uppercase bg-zinc-100 hover:bg-black hover:text-white px-3 py-2 border border-black transition-colors">
                            <Download className="w-3 h-3" />
                            <span>DOWNLOAD</span>
                          </button>
                        </td>
                        <td className="p-5 flex space-x-3">
                          <button onClick={() => handleViewOrder(o.id)} className="p-3 bg-black text-white border border-gray-200 hover:bg-black text-white hover:bg-gray-800 transition-colors"><Eye className="w-4 h-4" /></button>
                          <select value={o.status} onChange={(e) => handleStatusChange(o.id, e.target.value)} className="bg-gray-100 border border-gray-200 p-2 text-[9px] font-black uppercase outline-none cursor-pointer">
                            <option value="Pending">Pending</option>
                            <option value="Shipped">Shipped</option>
                            <option value="Delivered">Delivered</option>
                          </select>
                          <button onClick={() => handleDeleteOrder(o.id)} className="p-3 bg-red-50 text-red-600 border border-gray-200 hover:bg-red-600 hover:text-white transition-colors"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white border border-gray-200 p-4 shadow-sm transition-all items-stretch">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="bg-black text-white px-6 py-3 font-black text-[10px] uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    PREV CYCLE
                  </button>
                  <div className="flex flex-col items-center justify-center">
                    <span className="font-serif text-xl">SECTOR {currentPage} / {totalPages}</span>
                    <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">
                      VIEWING 50 ORDERS PER CYCLE
                    </span>
                  </div>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="bg-black text-white px-6 py-3 font-black text-[10px] uppercase disabled:opacity-50 disabled:cursor-not-allowed hover:bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    NEXT CYCLE
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Selected Order Modal */}
          {selectedOrder && (
            <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/90 overflow-y-auto print:relative print:bg-white print:p-0 print:block">
              <div className="bg-white border border-gray-200 max-w-4xl w-full shadow-sm transition-all relative print:border-0 print:shadow-none print:max-w-none">
                <div className="bg-black text-white p-6 flex justify-between items-center border-b-4 border-black print:text-black print:border-b-2 print:p-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-black text-white hover:bg-gray-800 p-3 border-2 border-white rotate-6 print:hidden">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="font-serif text-2xl uppercase tracking-tighter">ORDER HAUL: {selectedOrder.id}</h2>
                      <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">DECODED ON {new Date(selectedOrder.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex space-x-4 print:hidden">
                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-black text-white border-2 border-white/20 hover:bg-black text-white hover:bg-gray-800 hover:border-black transition-all flex items-center space-x-2">
                      <Grid className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase hidden md:inline">RETURN TO DASHBOARD</span>
                    </button>
                    <button onClick={() => handleDownloadInvoice(selectedOrder)} className="p-3 bg-zinc-800 border-2 border-zinc-700 hover:bg-black text-white hover:bg-gray-800 transition-all flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase">INVOICE</span>
                    </button>
                    <button onClick={() => generateShippingLabel(selectedOrder)} className="p-3 bg-zinc-800 border-2 border-zinc-700 hover:bg-black text-white hover:bg-gray-800 transition-all flex items-center space-x-2">
                      <Barcode className="w-5 h-5" />
                      <span className="text-[9px] font-black uppercase">LABEL</span>
                    </button>
                    <button onClick={() => handleCopyDetails(selectedOrder)} className="p-3 bg-zinc-800 border-2 border-zinc-700 hover:bg-black text-white hover:bg-gray-800 transition-all flex items-center space-x-2">
                      {copyFeedback ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                      <span className="text-[9px] font-black uppercase hidden md:inline">COPY</span>
                    </button>
                    <button onClick={() => setSelectedOrder(null)} className="p-3 bg-zinc-800 border-2 border-zinc-700 hover:bg-red-600 transition-all">
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>

                {/* Shipping Label Specialized Print Area */}
                <div className="hidden print:block p-8 border border-gray-200 m-4">
                  <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-8">
                    <div className="space-y-2">
                      <h1 className="font-serif text-4xl">KNOTTY TOWN</h1>
                      <p className="text-[10px] font-black uppercase">ROYAL STREETWEAR • MANGALORE, IN</p>
                    </div>
                    <div className="w-24 h-24 border border-gray-200 p-2 flex items-center justify-center">
                      <QrCode className="w-full h-full" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <div className="space-y-6">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">SHIP TO:</p>
                      <div className="text-2xl font-black uppercase leading-tight">
                        {selectedOrder.customer_name}<br />
                        {selectedOrder.address}<br />
                        {selectedOrder.city}, {selectedOrder.pincode}
                      </div>
                      <p className="font-black text-lg">{selectedOrder.customer_phone}</p>
                    </div>
                    <div className="space-y-6 text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">ORDER INFO:</p>
                      <p className="font-serif text-2xl uppercase">{selectedOrder.id}</p>
                      <p className="font-black text-sm uppercase">WEIGHT: ~0.5 KG</p>
                      <p className="font-black text-sm uppercase">TYPE: LUXURY APPAREL</p>
                    </div>
                  </div>

                  <div className="mt-16 pt-8 border-t-4 border-dashed border-black flex justify-between items-center">
                    <div className="flex space-x-2">
                      {[...Array(20)].map((_, i) => <div key={i} className={`w-2 h-16 bg-black ${i % 3 === 0 ? 'w-1' : ''}`}></div>)}
                    </div>
                    <p className="font-serif text-2xl rotate-90 origin-right whitespace-nowrap">KT-EXPRESS-AIR</p>
                  </div>
                </div>

                <div className="p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-12 print:hidden">
                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-black pb-2">CUSTOMER INTEL</h3>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-black uppercase">
                        <div className="text-zinc-400">NAME</div>
                        <div>{selectedOrder.customer_name}</div>
                        <div className="text-zinc-400">EMAIL</div>
                        <div className="lowercase">{selectedOrder.customer_email}</div>
                        <div className="text-zinc-400">PHONE</div>
                        <div>{selectedOrder.customer_phone}</div>
                        <div className="text-zinc-400">VALUATION</div>
                        <div className="text-black font-serif text-lg">₹{selectedOrder.total}</div>
                        <div className="text-zinc-400">PAYMENT STATUS</div>
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${selectedOrder.payment_status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                            }`}>
                            {selectedOrder.payment_status || 'Pending'}
                          </span>
                        </div>
                        {selectedOrder.payment_id && (
                          <>
                            <div className="text-zinc-400">PAYMENT ID</div>
                            <div className="flex items-center space-x-2">
                              <div className="text-[8px] font-mono break-all">{selectedOrder.payment_id}</div>
                              {selectedOrder.payment_method?.toLowerCase().includes('razorpay') && (
                                <button
                                  onClick={() => handleVerifyRazorpay(selectedOrder.payment_id)}
                                  className="px-2 py-1 bg-black text-white text-[7px] font-black uppercase hover:bg-black text-white hover:bg-gray-800 transition-colors"
                                  disabled={verifyingPayment === selectedOrder.payment_id}
                                >
                                  {verifyingPayment === selectedOrder.payment_id ? 'VERIFYING...' : 'VERIFY'}
                                </button>
                              )}
                            </div>
                            {razorpayStatus && razorpayStatus.id === selectedOrder.payment_id && (
                              <div className="col-span-2 mt-4 p-4 bg-zinc-900 text-white border-2 border-dashed border-[#FF4500] animate-in slide-in-from-top-2">
                                <h4 className="text-[9px] font-black uppercase mb-3 flex items-center text-black">
                                  <ShieldCheck className="w-3 h-3 mr-2" />
                                  RAZORPAY LIVE INTEL
                                </h4>
                                <div className="grid grid-cols-2 gap-y-2 text-[8px] font-bold uppercase">
                                  <div className="text-zinc-500">LIVE STATUS</div>
                                  <div className={razorpayStatus.status === 'captured' ? 'text-green-400' : 'text-yellow-400'}>
                                    {razorpayStatus.status}
                                  </div>
                                  <div className="text-zinc-500">AMOUNT</div>
                                  <div>₹{razorpayStatus.amount}</div>
                                  <div className="text-zinc-500">METHOD</div>
                                  <div>{razorpayStatus.method}</div>
                                  <div className="text-zinc-500">EMAIL</div>
                                  <div className="lowercase">{razorpayStatus.email}</div>
                                  <div className="text-zinc-500">TIMESTAMP</div>
                                  <div>{razorpayStatus.created_at}</div>
                                </div>
                                {razorpayStatus.status === 'captured' && selectedOrder.payment_status !== 'PAID' && (
                                  <button
                                    onClick={() => handleUpdateToPaid(selectedOrder.id, selectedOrder.payment_id)}
                                    className="w-full mt-4 py-2 bg-black text-white hover:bg-gray-800 text-black text-[8px] font-black uppercase hover:bg-white transition-colors border border-gray-200"
                                  >
                                    FORCE UPDATE TO PAID
                                  </button>
                                )}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-black pb-2">DROP LOCATION</h3>
                      <div className="p-4 bg-gray-50 border border-gray-200 text-[11px] font-bold leading-relaxed uppercase">
                        {selectedOrder.address},<br />
                        {selectedOrder.city}, {selectedOrder.pincode}
                      </div>
                    </div>

                    <div className="space-y-4 print:hidden">
                      <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-black pb-2">PAYMENT PROOF</h3>
                      <div className="bg-gray-100 border border-gray-200 aspect-[4/3] flex items-center justify-center overflow-hidden">
                        {selectedOrder.payment_screenshot ? (
                          <img src={selectedOrder.payment_screenshot} className="w-full h-full object-contain" alt="Payment Screenshot" />
                        ) : (
                          <div className="text-center p-6">
                            <Activity className="w-10 h-10 text-zinc-300 mx-auto mb-4" />
                            <p className="text-[9px] font-black uppercase text-zinc-400">NO SCREENSHOT UPLOADED</p>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span className="text-zinc-400">METHOD:</span>
                        <span className="bg-black text-white px-3 py-1">{selectedOrder.payment_method}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="space-y-4">
                      <h3 className="font-black text-sm uppercase tracking-widest border-b-2 border-black pb-2">HAUL CONTENTS</h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 print:max-h-none print:overflow-visible">
                        {selectedOrder.items?.map((item: any, idx: number) => {
                          const product = products.find(p => p.id === item.product_id) || products.find(p => p.name === item.name);
                          const displayImage = item.custom_design || product?.image;

                          return (
                            <div key={idx} className="flex space-x-4 pb-4 border-b border-gray-100 last:border-0 group">
                              <div className="w-16 h-16 bg-zinc-100 border border-gray-200 overflow-hidden shrink-0 print:border-0 print:w-12 print:h-12 relative group-hover:scale-105 transition-transform">
                                {displayImage ? (
                                  <img src={displayImage} className="w-full h-full object-cover" alt="Product Asset" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                                    <Package className="w-6 h-6" />
                                  </div>
                                )}

                                {item.custom_design && (
                                  <div className="absolute top-0 right-0 bg-black text-white hover:bg-gray-800 text-white p-1 shadow-sm">
                                    <Sparkles className="w-3 h-3" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-grow">
                                <h4 className="text-[11px] font-black uppercase mb-1">{item.name}</h4>
                                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                                  <span>SIZE: <span className="text-black">{item.selected_size || 'L'}</span></span>
                                  <span>QTY: <span className="text-black">{item.quantity}</span></span>
                                  <span className="text-black">₹{item.price}</span>
                                </div>
                                {item.custom_design && (
                                  <a href={item.custom_design} download={`custom-design-${selectedOrder.id}-${idx}.png`} className="flex items-center space-x-1 text-[9px] font-black uppercase text-blue-600 hover:underline mt-2" onClick={(e) => e.stopPropagation()}>
                                    <Download className="w-3 h-3" />
                                    <span>DOWNLOAD CUSTOM ART</span>
                                  </a>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="bg-black text-white p-6 space-y-4 print:bg-white print:text-black print:border-2 print:border-black print:p-4">
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span>SUBTOTAL</span>
                        <span>₹{(selectedOrder.total - (parseFloat(selectedOrder.shipping_price || '0'))).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] font-black uppercase">
                        <span>SHIPPING</span>
                        <span>₹{parseFloat(selectedOrder.shipping_price || '0').toFixed(2)}</span>
                      </div>
                      <div className="pt-4 border-t border-zinc-700 flex justify-between items-center print:border-black">
                        <span className="font-serif text-xl uppercase">TOTAL HAUL</span>
                        <span className="font-serif text-2xl text-black">₹{selectedOrder.total}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-8 md:p-12 pt-0 print:hidden">
                  <button onClick={() => setSelectedOrder(null)} className="w-full bg-black text-white py-6 font-serif text-xl uppercase hover:bg-black text-white hover:bg-gray-800 transition-colors border border-gray-200 shadow-sm transition-all flex items-center justify-center space-x-3">
                    <ArrowLeft className="w-6 h-6" />
                    <span>RETURN TO DASHBOARD</span>
                  </button>
                </div>

                <div className="bg-zinc-50 p-6 border-t-4 border-black text-center print:border-t-2 print:p-4">
                  <p className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-400">© 2026 KNOTTY TOWN CLOTHING • ROYAL QUALITY ASSURED</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-16 animate-in fade-in duration-500">
              <div className="flex justify-between items-end">
                <h2 className="font-serif text-4xl uppercase">THE <span className="text-black">VAULT.</span></h2>
                <button
                  onClick={() => { setEditingProduct(null); setNewProduct(INITIAL_NEW_PRODUCT); setFeaturesInput(''); setSelectedSizes(ALL_SIZES); setIsSoldOutToggle(false); setIsFeaturedToggle(false); setShowAddProduct(true); }}
                  className="bg-black text-white px-10 py-5 font-black uppercase text-xs shadow-sm transition-all"
                >
                  + NEW DROP
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-10">
                {products.map(p => (
                  <div key={p.id} className="bg-white border border-gray-200 p-4 shadow-sm transition-all group relative">
                    {p.isSoldOut && (
                      <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center backdrop-blur-[2px]">
                        <div className="bg-black text-white hover:bg-gray-800 text-white px-6 py-2 border border-gray-200 font-serif text-xl rotate-[-12deg] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          SOLD OUT
                        </div>
                      </div>
                    )}
                    {p.isFeatured && (
                      <div className="absolute top-2 left-2 z-20 bg-yellow-400 text-black p-1 border border-black shadow-sm transition-all">
                        <Star className="w-3 h-3 fill-current" />
                      </div>
                    )}
                    {p.originalPrice && p.originalPrice > p.price && (
                      <div className="absolute top-2 right-2 z-20 bg-black text-white px-2 py-1 border border-white text-[8px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                        LIVE OFFER
                      </div>
                    )}
                    <div className="relative aspect-[4/5] overflow-hidden mb-6 border border-gray-200">
                      <img src={p.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                        <button onClick={() => startEditProduct(p)} className="p-4 bg-white text-black border border-gray-200"><Edit2 className="w-5 h-5" /></button>
                        <button onClick={async () => { if (confirm("ABORT DROP?")) { await deleteProduct(p.id); loadData(); } }} className="p-4 bg-white text-red-600 border border-gray-200"><Trash2 className="w-5 h-5" /></button>
                      </div>
                    </div>
                    <h4 className="font-black text-sm uppercase mb-2 truncate">{p.name}</h4>
                    <div className="flex items-center space-x-3 mb-4">
                      <p className="font-serif text-2xl text-black">₹{p.price}</p>
                      {p.originalPrice && <p className="text-[10px] font-bold text-gray-400 line-through">₹{p.originalPrice}</p>}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {p.availableSizes?.map(s => <span key={s} className="text-[7px] font-black border border-black/10 px-1 py-0.5 uppercase">{s}</span>)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Product Pagination Controls */}
              {totalProductPages > 1 && (
                <div className="flex justify-between items-center bg-white border border-gray-200 p-8 shadow-sm transition-all">
                  <button
                    onClick={() => handleProductPageChange(productPage - 1)}
                    disabled={productPage === 1}
                    className="bg-black text-white px-10 py-5 font-black text-[10px] uppercase disabled:opacity-30 hover:bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    PREV SECTOR
                  </button>
                  <div className="text-center">
                    <span className="font-serif text-2xl uppercase">DROP SECTOR {productPage} / {totalProductPages}</span>
                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.3em] mt-2">BATTALION OF {products.length} SILHOUETTES</p>
                  </div>
                  <button
                    onClick={() => handleProductPageChange(productPage + 1)}
                    disabled={productPage === totalProductPages}
                    className="bg-black text-white px-10 py-5 font-black text-[10px] uppercase disabled:opacity-30 hover:bg-black text-white hover:bg-gray-800 transition-colors"
                  >
                    NEXT SECTOR
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vault' && (
            <div className="max-w-6xl space-y-12 animate-in fade-in duration-500">
              <div className="flex justify-between items-end border-b-4 border-black pb-8">
                <div>
                  <h1 className="font-headline text-6xl italic font-light tracking-tighter text-primary uppercase">Secret <span className="text-accent">Archives.</span></h1>
                  <p className="text-[10px] font-body uppercase tracking-[0.5em] text-secondary/40 mt-6 italic">CLASSIFIED CLEARANCE LEVEL 5 — ACCESS RESTRICTED</p>
                </div>
                <button
                  onClick={() => {
                    setNewProduct({ ...INITIAL_NEW_PRODUCT, category: Category.VAULT });
                    setEditingProduct(null);
                    setShowAddProduct(true);
                  }}
                  className="bg-primary text-white px-12 py-6 font-body uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-black transition-all flex items-center"
                >
                  <Lock className="w-4 h-4 mr-4" /> ADD CLASSIFIED DROP
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Security Settings */}
                <div className="bg-primary text-white p-12 border border-white/5 shadow-2xl space-y-12">
                  <div className="flex items-center space-x-5 mb-10 opacity-60">
                    <ShieldCheck className="w-8 h-8 text-accent" />
                    <h3 className="font-headline text-3xl italic tracking-tighter uppercase">Security Protocols</h3>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[9px] font-body uppercase tracking-[0.4em] text-white/30 italic">CURRENT VAULT PASSKEY</label>
                    <div className="flex space-x-6">
                      <input
                        type="text"
                        value={vaultPasskey}
                        onChange={(e) => setVaultPasskey(e.target.value.toUpperCase())}
                        className="flex-grow bg-white/5 border border-white/10 p-6 font-body text-xl tracking-[0.4em] text-accent uppercase outline-none focus:border-accent/40"
                      />
                      <button onClick={saveVaultSettings} className="bg-accent text-white px-10 font-body uppercase text-[10px] tracking-[0.4em] hover:bg-white hover:text-primary transition-all duration-700">
                        UPDATE
                      </button>
                    </div>
                    <p className="text-[8px] text-zinc-600 uppercase font-bold">WARNING: CHANGING THIS WILL INVALIDATE OLD KEYS.</p>
                  </div>

                  <div className="space-y-4 pt-8 border-t border-zinc-800">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">VAULT BROADCAST MESSAGE</label>
                    <textarea
                      value={vaultMessage}
                      onChange={(e) => setVaultMessage(e.target.value)}
                      className="w-full bg-black border-2 border-zinc-700 p-4 text-xs font-bold text-zinc-300 uppercase outline-none focus:border-purple-500 h-24 resize-none"
                      placeholder="ENTER ENCRYPTED MESSAGE FOR VAULT MEMBERS..."
                    ></textarea>
                    <button onClick={saveVaultSettings} className="w-full bg-zinc-800 text-zinc-400 py-3 font-black uppercase text-[9px] hover:bg-white hover:text-black transition-colors">
                      BROADCAST TO MEMBERS
                    </button>
                  </div>
                </div>

                {/* Vault Inventory */}
                <div className="space-y-6">
                  <h3 className="font-black text-xl uppercase tracking-tight flex items-center"><Package className="w-5 h-5 mr-3" /> VAULT INVENTORY</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {products.filter(p => p.category === 'Secret Vault').length === 0 ? (
                      <div className="p-12 border-4 border-dashed border-gray-200 text-center">
                        <p className="text-gray-300 font-black text-xs uppercase tracking-widest">VAULT IS EMPTY</p>
                      </div>
                    ) : (
                      products.filter(p => p.category === 'Secret Vault').map(p => (
                        <div key={p.id} className="bg-white border border-gray-200 p-4 flex items-center space-x-4 shadow-sm transition-all group hover:border-purple-600 transition-colors">
                          <div className="w-16 h-16 bg-zinc-100 border border-gray-200 flex-shrink-0">
                            <img src={p.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0" />
                          </div>
                          <div className="flex-grow">
                            <h4 className="font-black text-sm uppercase">{p.name}</h4>
                            <p className="text-[10px] font-bold text-gray-400">STOCK: {p.stock_quantity || 0} / 5</p>
                          </div>
                          <div className="flex space-x-2">
                            <button onClick={() => startEditProduct(p)} className="p-2 border border-gray-200 hover:bg-black hover:text-white"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={async () => { if (confirm("DELETE CLASSIFIED ITEM?")) { await deleteProduct(p.id); clearProductCache(); loadData(); } }} className="p-2 border border-gray-200 hover:bg-red-600 hover:text-white hover:border-red-600"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'recovery' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
             <div className="flex justify-between items-end mb-16 px-4">
                <div>
                  <h1 className="text-6xl font-black uppercase tracking-tighter mb-4 italic">ABANDONED<br/>ARCHIVES.</h1>
                  <p className="text-[10px] font-black uppercase tracking-[0.5em] text-red-600 animate-pulse">DETECTING UNFINISHED COLLECTIONS</p>
                </div>
                <div className="bg-black text-white p-8 text-center min-w-[200px]">
                  <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2">REVENUE IN LIMBO</p>
                  <p className="text-4xl font-black italic">₹{abandonedCarts.reduce((acc, c) => {
                    try {
                      const items = JSON.parse(c.cart_data);
                      return acc + items.reduce((iAcc: any, i: any) => iAcc + (i.price * i.quantity), 0);
                    } catch(e) { return acc; }
                  }, 0).toLocaleString()}</p>
                </div>
             </div>

             <div className="bg-white border-t border-gray-100">
                {abandonedCarts.length === 0 ? (
                  <div className="p-32 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.8em] text-gray-300">NO GHOSTS IN THE MACHINE.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {abandonedCarts.map((cart, idx) => {
                      const items = JSON.parse(cart.cart_data);
                      const total = items.reduce((acc: any, i: any) => acc + (i.price * i.quantity), 0);
                      return (
                        <div key={cart.id} className="p-12 hover:bg-gray-50 transition-colors group flex items-start justify-between">
                          <div className="flex gap-12">
                            <div className="w-16 h-16 bg-gray-900 text-white flex items-center justify-center font-black text-xs italic">
                              #{idx + 1}
                            </div>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4">
                                <p className="text-xl font-black uppercase italic">{cart.name || 'ANONYMOUS'}</p>
                                <span className={`text-[8px] font-black uppercase px-2 py-1 ${cart.status === 'recovered_sent' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                  {cart.status === 'recovered_sent' ? 'NUDGE SENT' : 'ABANDONED'}
                                </span>
                              </div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">{cart.phone} • {new Date(cart.updated_at).toLocaleString()}</p>
                              
                              <div className="flex gap-4 pt-4">
                                {items.map((i: any, kidx: any) => (
                                  <div key={kidx} className="relative w-12 h-16 border border-gray-100">
                                    <img src={i.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" alt="" />
                                    <span className="absolute -top-2 -right-2 bg-black text-white text-[8px] px-1 font-black">x{i.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>

                          <div className="text-right flex flex-col items-end gap-6">
                            <p className="text-3xl font-black italic">₹{total.toLocaleString()}</p>
                            <button 
                              disabled={isSendingRecovery === cart.phone}
                              onClick={() => handleSendRecovery(cart.phone, cart.name)}
                              className={`px-8 py-4 text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-3 transition-all ${
                                cart.status === 'recovered_sent' 
                                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'bg-black text-white hover:bg-red-600 active:scale-95'
                              }`}
                            >
                              {isSendingRecovery === cart.phone ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Zap className="w-3 h-3" />}
                              <span>{cart.status === 'recovered_sent' ? 'Resend Nudge' : 'Recover Via WhatsApp'}</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
             </div>
          </div>
        )}

          {activeTab === 'plates' && (
            <div className="space-y-16 animate-in fade-in duration-500">
              <div className="flex justify-between items-end border-b-4 border-black pb-8">
                <div>
                  <h1 className="font-headline text-6xl italic font-light tracking-tighter text-primary uppercase">Metal <span className="text-accent">Boutique.</span></h1>
                  <p className="text-[10px] font-body uppercase tracking-[0.5em] text-secondary/40 mt-6 italic">AERONAUTICAL GRADE ALUMINUM MANAGEMENT</p>
                </div>
                <button
                  onClick={() => {
                    setNewProduct({ ...INITIAL_NEW_PRODUCT, category: Category.METAL_POSTERS });
                    setEditingProduct(null);
                    setFeaturesInput('Brushed Aluminum, Hidden Mount, Scratch Resistant');
                    setShowAddPlate(true);
                  }}
                  className="bg-black text-white px-12 py-6 font-body uppercase text-[10px] tracking-[0.4em] shadow-2xl hover:bg-zinc-900 transition-all flex items-center"
                >
                  <Plus className="w-4 h-4 mr-4" /> NEW PLATE DESIGN
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                <StatCard icon={ImageIcon} label="Total Plating Designs" value={products.filter(p => p.category === 'Metal Posters').length.toString()} color="bg-accent/10" />
                <StatCard icon={TrendingUp} label="Gallery Valuation" value={`₹${products.filter(p => p.category === 'Metal Posters').reduce((a, p) => a + (p.price || 0), 0).toLocaleString()}`} color="bg-primary/5" />
                <StatCard icon={Package} label="Series Count" value="1" color="bg-primary/5" />
                <StatCard icon={Activity} label="Status" value="ENGINEERED" color="bg-green-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {products.filter(p => p.category === 'Metal Posters').length === 0 ? (
                  <div className="col-span-full p-24 border-4 border-dashed border-gray-200 text-center bg-white">
                    <p className="text-gray-300 font-black text-xs uppercase tracking-widest">NO METAL PLATES IN COLLECTION</p>
                  </div>
                ) : (
                  products.filter(p => p.category === 'Metal Posters').map(p => (
                    <div key={p.id} className="bg-white border border-gray-200 group relative overflow-hidden transition-all hover:shadow-2xl">
                      <div className="aspect-[4/5] bg-zinc-100 overflow-hidden relative">
                        <img src={p.image} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-4">
                          <button onClick={() => { startEditProduct(p); setShowAddPlate(true); }} className="p-4 bg-white text-black hover:bg-accent hover:text-white transition-all"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={async () => { if (confirm("DESTROY PLATE DESIGN?")) { await deleteProduct(p.id); clearProductCache(); loadData(); } }} className="p-4 bg-white text-red-600 hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                        {p.originalPrice && p.originalPrice > p.price && (
                          <div className="absolute top-4 right-4 bg-accent text-white px-3 py-1 font-body text-[8px] tracking-widest uppercase italic">
                            -{Math.round((1 - p.price / p.originalPrice) * 100)}%
                          </div>
                        )}
                      </div>
                      <div className="p-8">
                        <span className="text-[9px] text-accent font-body tracking-[0.4em] uppercase mb-3 block opacity-40 italic">Serie Anthology / 01</span>
                        <h4 className="font-headline text-2xl text-primary group-hover:italic transition-all duration-500 mb-4">{p.name}</h4>
                        <div className="flex items-center space-x-4">
                           <span className="font-serif text-xl tracking-tighter text-primary">₹{p.price}</span>
                           {p.originalPrice && <span className="text-[10px] text-secondary/40 line-through">₹{p.originalPrice}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="max-w-4xl space-y-16 animate-in fade-in duration-500">
              {/* QR Code Settings */}
              <div className="bg-white p-8 border border-gray-200 shadow-sm transition-all space-y-6">
                <h3 className="font-serif text-2xl uppercase">Payment Settings</h3>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2">UPI QR Code</label>
                  <div className="flex items-center space-x-4">
                    {customQrImage && <img src={customQrImage} className="w-20 h-20 border border-gray-200" />}
                    <input type="file" onChange={handleQrUpload} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:border-2 file:border-black file:text-xs file:font-black file:uppercase file:bg-zinc-100 hover:file:bg-zinc-200" />
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-200">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Razorpay Key ID</label>
                  <input
                    type="text"
                    value={razorpayKey}
                    onChange={(e) => setRazorpayKey(e.target.value)}
                    placeholder="rzp_test_..."
                    className="w-full p-4 border border-gray-200 font-black uppercase text-xs"
                  />
                  <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Crucial for handling payments. Keep this secure.</p>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-200">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Razorpay Key Secret</label>
                  <input
                    type="password"
                    value={razorpaySecret}
                    onChange={(e) => setRazorpaySecret(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="w-full p-4 border border-gray-200 font-black text-xs"
                  />
                  <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Never share this. Used for secure payment verification.</p>
                </div>

                <div className="pt-10 mt-10 border-t-2 border-dashed border-gray-200">
                  <h3 className="font-serif text-2xl uppercase flex items-center mb-6">
                    <Phone className="w-5 h-5 mr-3" /> WhatsApp Notifications
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest mb-2">WhatsApp API Gateway URL</label>
                      <input
                        type="text"
                        value={whatsappApiUrl}
                        onChange={(e) => setWhatsappApiUrl(e.target.value)}
                        placeholder="https://api.whatsapp-gateway.com/send"
                        className="w-full p-4 border border-gray-200 font-black text-xs uppercase"
                      />
                      <p className="text-[8px] text-gray-500 mt-2 font-bold uppercase tracking-widest">Endpoint for sending messages (e.g., UltraMsg, Interakt, etc.)</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2">API Token / Secret</label>
                        <input
                          type="password"
                          value={whatsappToken}
                          onChange={(e) => setWhatsappToken(e.target.value)}
                          placeholder="••••••••••••••••"
                          className="w-full p-4 border border-gray-200 font-black text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Instance ID (Optional)</label>
                        <input
                          type="text"
                          value={whatsappInstanceId}
                          onChange={(e) => setWhatsappInstanceId(e.target.value)}
                          placeholder="INSTANCE_123"
                          className="w-full p-4 border border-gray-200 font-black text-xs"
                        />
                      </div>
                    </div>
                    <p className="text-[8px] text-red-500 font-black uppercase tracking-widest">
                      * If left blank, notifications will be archived in api/whatsapp_log.txt for simulation.
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t-2 border-dashed border-gray-200">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Unisex Custom Tee Base Price (₹)</label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="number"
                      value={customPrice}
                      onChange={(e) => setCustomPrice(e.target.value)}
                      className="p-3 border border-gray-200 w-40 font-black"
                    />
                    <button onClick={handleUpdatePrice} className="bg-black text-white px-6 py-3 border border-gray-200 font-black text-xs uppercase hover:bg-black text-white hover:bg-gray-800">
                      UPDATE PRICE
                    </button>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-10 shadow-sm transition-all">
                <h3 className="font-serif text-3xl mb-12 uppercase tracking-tighter">PORTAL CONFIG.</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-start">
                  <div className="space-y-12">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">QR PORTAL ASSET</label>
                      <div onClick={() => qrFileInputRef.current?.click()} className="border-4 border-dashed border-black aspect-square flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden group">
                        {customQrImage ? <img src={customQrImage} className="w-full h-full object-contain" /> : <Upload className="w-12 h-12 text-gray-300" />}
                        <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={handleQrUpload} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center">
                        <Crown className="w-4 h-4 mr-2 text-yellow-400" /> ROYAL LION BRANDING ASSET
                      </label>
                      <div onClick={() => brandingFileInputRef.current?.click()} className="border-4 border-dashed border-black aspect-square flex items-center justify-center bg-gray-50 cursor-pointer overflow-hidden group relative">
                        {royalLionBranding ? (
                          <>
                            <img src={royalLionBranding} className="w-full h-full object-contain" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <RefreshCw className="text-white w-8 h-8" />
                            </div>
                          </>
                        ) : (
                          <Upload className="w-12 h-12 text-gray-300" />
                        )}
                        <input type="file" ref={brandingFileInputRef} className="hidden" accept="image/*" onChange={handleBrandingUpload} />
                      </div>
                      <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">THIS IMAGE WILL BE USED IN THE CUSTOM LAB AS THE DEFAULT BRANDING.</p>
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="space-y-4">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">GLOBAL SHIPPING (₹)</label>
                      <input type="number" value={localShippingPrice} onChange={e => setLocalShippingPrice(Number(e.target.value))} className="w-full border border-gray-200 p-6 font-black text-2xl" />
                    </div>
                    <button onClick={saveSettings} disabled={isSavingSettings} className="w-full bg-black text-white p-8 font-black uppercase text-sm shadow-sm transition-all hover:bg-black text-white hover:bg-gray-800">{isSavingSettings ? 'CONFIGURING...' : 'SYNC ALL SYSTEMS'}</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="space-y-16 animate-in fade-in duration-500 print:hidden">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="bg-white border border-gray-200 p-8 shadow-sm">
                  <h3 className="font-serif text-2xl mb-8 uppercase text-black">Generate Coupons</h3>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">DISCOUNT AMOUNT (₹)</label>
                        <input type="number" required value={couponAmount} onChange={e => setCouponAmount(e.target.value)} placeholder="e.g. 500" className="w-full border border-gray-200 p-4 font-black text-xl outline-none focus:border-black transition-colors" />
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">QUANTITY</label>
                        <input type="number" required min="1" max="100" value={couponCount} onChange={e => setCouponCount(Number(e.target.value))} className="w-full border border-gray-200 p-4 font-black text-xl outline-none focus:border-black transition-colors" />
                      </div>
                    </div>
                    <button onClick={handleCreateCoupons} disabled={!couponAmount || Number(couponAmount) <= 0} className="w-full bg-black text-white p-6 font-black uppercase text-xs shadow-sm transition-all hover:bg-black text-white hover:bg-gray-800 disabled:opacity-50 mt-4 border border-black">
                      MINT {couponCount} COUPON{couponCount > 1 ? 'S' : ''}
                    </button>
                    {lastGenerated.length > 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 mt-4 animate-in fade-in slide-in-from-top-2">
                        <p className="text-[9px] font-black text-green-700 uppercase mb-2">LAST GENERATED:</p>
                        <div className="flex flex-wrap gap-2">
                          {lastGenerated.map(code => (
                            <code key={code} className="bg-white px-3 py-1 border border-green-200 text-xs font-mono font-bold select-all cursor-copy" title="Click to select">{code}</code>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col space-y-4">
                  <StatCard icon={Tag} label="Active Coupons" value={coupons.filter(c => c.is_used == 0).length.toString()} color="bg-accent/10" />
                  <StatCard icon={List} label="Used Coupons" value={coupons.filter(c => c.is_used == 1).length.toString()} color="bg-primary/5" />
                </div>
              </div>

              <div className="bg-white border border-gray-200 shadow-sm transition-all overflow-hidden flex flex-col">
                <div className="bg-primary/5 p-6 border-b border-gray-200 flex justify-between items-center">
                  <h3 className="font-body text-[10px] uppercase tracking-[0.3em] font-black">All Coupons ({coupons.length})</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left min-w-[800px]">
                    <thead className="bg-[#f0f0f0] text-black text-[9px] font-body uppercase tracking-[0.2em]">
                      <tr>
                        <th className="p-6 font-black">Code</th>
                        <th className="p-6 font-black">Discount</th>
                        <th className="p-6 font-black">Status</th>
                        <th className="p-6 font-black">Created</th>
                        <th className="p-6 font-black text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {coupons.map((c, i) => (
                        <tr key={i} className="hover:bg-gray-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-sm tracking-widest">{c.code}</td>
                          <td className="p-4 font-serif text-lg">₹{c.discount_amount}</td>
                          <td className="p-4">
                            {c.is_used == 1 ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 text-[8px] uppercase font-black uppercase rounded-full">Used</span>
                            ) : (
                              <span className="px-3 py-1 bg-green-100 text-green-700 text-[8px] uppercase font-black uppercase rounded-full">Active</span>
                            )}
                          </td>
                          <td className="p-4 text-[10px] text-gray-500 font-bold">{new Date(c.created_at).toLocaleDateString()}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteCoupon(c.id)} className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {coupons.length === 0 && (
                        <tr><td colSpan={5} className="p-12 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">NO COUPONS FOUND.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {showAddPlate && (
        <div className="fixed inset-0 z-[350] overflow-y-auto bg-black/98 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4 md:p-6">
            <div className="bg-white border border-gray-200 p-8 md:p-14 max-w-4xl w-full relative my-8 shadow-sm transition-all">
              <div className="flex justify-between items-center mb-12 border-b-2 border-black pb-8">
                <div>
                  <h2 className="font-serif text-4xl uppercase tracking-tighter">{editingProduct ? 'RECONFIGURE PLATE' : 'NEW PLATE DROP'}</h2>
                  <p className="text-[9px] font-black uppercase text-zinc-400 mt-2 tracking-widest">AERONAUTICAL GRADE ALUMINUM SPECIFICATIONS</p>
                </div>
                <button onClick={() => setShowAddPlate(false)}><X className="w-10 h-10 hover:text-black transition-colors" /></button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-12">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PLATE DESIGN NAME</label>
                     <input 
                       required 
                       value={editingProduct ? editingProduct.name : newProduct.name} 
                       onChange={e => editingProduct ? setEditingProduct({...editingProduct, name: e.target.value}) : setNewProduct({...newProduct, name: e.target.value})}
                       className="w-full border-b-4 border-black p-6 font-serif text-2xl uppercase outline-none focus:bg-zinc-50" 
                       placeholder="e.g. THE BOTANIST" 
                     />
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">CURATED PRICE (DISCOUNTED)</label>
                     <div className="relative">
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 font-serif text-2xl">₹</span>
                       <input 
                         required 
                         type="number"
                         value={editingProduct ? editingProduct.price : newProduct.price} 
                         onChange={e => editingProduct ? setEditingProduct({...editingProduct, price: Number(e.target.value)}) : setNewProduct({...newProduct, price: Number(e.target.value)})}
                         className="w-full border-b-4 border-black p-6 pl-8 font-serif text-2xl outline-none focus:bg-zinc-50" 
                         placeholder="1599" 
                       />
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">FIRST PRICE (MRP/ORIGINAL)</label>
                     <div className="relative">
                       <span className="absolute left-0 top-1/2 -translate-y-1/2 font-serif text-2xl text-zinc-300">₹</span>
                       <input 
                         type="number"
                         value={editingProduct ? editingProduct.originalPrice : newProduct.originalPrice} 
                         onChange={e => editingProduct ? setEditingProduct({...editingProduct, originalPrice: Number(e.target.value)}) : setNewProduct({...newProduct, originalPrice: Number(e.target.value)})}
                         className="w-full border-b-4 border-zinc-200 p-6 pl-8 font-serif text-2xl text-zinc-400 outline-none focus:border-black focus:text-black" 
                         placeholder="2499" 
                       />
                     </div>
                   </div>
                   <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">COLLECTION SERIES</label>
                     <input 
                       value="Series Anthology 01"
                       disabled
                       className="w-full border-b-4 border-zinc-100 p-6 font-body text-xs uppercase tracking-[0.3em] bg-zinc-50 text-zinc-400 cursor-not-allowed" 
                     />
                   </div>
                </div>

                <div className="space-y-6">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">PLATE DESIGN ASSET</label>
                  <div 
                    onClick={() => frontFileInputRef.current?.click()}
                    className="relative border-4 border-dashed border-black aspect-video flex flex-col items-center justify-center bg-zinc-50 cursor-pointer overflow-hidden group hover:bg-zinc-100 transition-all"
                  >
                    {(editingProduct?.image || newProduct.image) ? (
                      <>
                        <img src={editingProduct ? editingProduct.image : newProduct.image} className="w-full h-full object-contain" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-4">
                          <RefreshCw className="w-10 h-10 animate-spin-slow" />
                          <span className="text-[10px] font-black uppercase tracking-widest">SWAP DESIGN ASSET</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-16 h-16 mx-auto text-zinc-200 mb-4 group-hover:text-black transition-colors" />
                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">UPLOAD HIGH-RES ARTWORK</p>
                        <p className="text-[8px] text-zinc-400 mt-2 uppercase">PNG / JPG / WEBP — MIN 2000PX</p>
                      </div>
                    )}
                    <input type="file" ref={frontFileInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'front')} />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">TECHNICAL NARRATIVE</label>
                    <button 
                      type="button"
                      onClick={() => handleAutoWriteDescription(true)}
                      className="text-[9px] font-black uppercase text-yellow-500 hover:text-black transition-colors flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Write Lore</span>
                    </button>
                  </div>
                  <textarea 
                    required 
                    value={editingProduct ? editingProduct.description : newProduct.description} 
                    onChange={e => editingProduct ? setEditingProduct({...editingProduct, description: e.target.value}) : setNewProduct({...newProduct, description: e.target.value})}
                    className="w-full border-4 border-black p-8 font-body text-[11px] uppercase tracking-[0.1em] h-40 outline-none focus:bg-zinc-50 leading-relaxed" 
                    placeholder="DESCRIBE THE ARTISTRY AND TECHNICAL SPECS..." 
                  />
                </div>

                <div className="grid grid-cols-2 gap-8 pt-6">
                  <button type="button" onClick={() => setShowAddPlate(false)} className="bg-zinc-100 p-8 font-black uppercase text-xs tracking-widest hover:bg-zinc-200 transition-colors">ABORT MISSION</button>
                  <button type="submit" className="bg-black text-white p-8 font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-zinc-900 transition-all">
                    {editingProduct ? 'SYNC CONFIGURATION' : 'EXECUTE PLATE DROP'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showAddProduct && (
        <div className="fixed inset-0 z-[350] overflow-y-auto bg-black/98 backdrop-blur-sm">
          <div className="min-h-full flex items-center justify-center p-4 md:p-6">
            <div className="bg-white border border-gray-200 p-8 md:p-14 max-w-4xl w-full relative my-8 shadow-sm transition-all shadow-[10px_10px_0px_0px_rgba(255,255,255,0.2)]">
              <div className="flex justify-between items-center mb-12">
                <h2 className="font-serif text-4xl uppercase tracking-tighter">{editingProduct ? 'EDIT DROP' : 'NEW DROP'}</h2>
                <button onClick={() => setShowAddProduct(false)}><X className="w-10 h-10 hover:text-black transition-colors" /></button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase">DROP NAME</label>
                    <input required value={editingProduct ? editingProduct.name : newProduct.name} onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, name: e.target.value }) : setNewProduct({ ...newProduct, name: e.target.value })} className="w-full border border-gray-200 p-5 font-black uppercase outline-none focus:bg-gray-50" placeholder="Product Name" />
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase">CATEGORY</label>
                    <select value={editingProduct ? editingProduct.category : newProduct.category} onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, category: e.target.value as Category }) : setNewProduct({ ...newProduct, category: e.target.value as Category })} className="w-full border border-gray-200 p-5 font-black uppercase bg-white cursor-pointer outline-none">
                      {Object.values(Category).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-black flex items-center mb-1">
                          <Zap className="w-3 h-3 mr-1 fill-current" /> CURRENT PRICE (₹)
                        </label>
                        <input
                          required
                          type="number"
                          value={editingProduct ? editingProduct.price : newProduct.price}
                          onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, price: Number(e.target.value) }) : setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                          className="w-full border border-gray-200 p-5 font-black text-xl outline-none focus:bg-gray-50"
                          placeholder="Price"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center mb-1">
                          <Package className="w-3 h-3 mr-1" /> STOCK QTY
                        </label>
                        <input
                          required
                          type="number"
                          value={editingProduct ? editingProduct.stock_quantity : newProduct.stock_quantity}
                          onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, stock_quantity: Number(e.target.value) }) : setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                          className="w-full border border-gray-200 p-5 font-black text-xl outline-none focus:bg-gray-50"
                          placeholder="100"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center">
                      <Percent className="w-3 h-3 mr-1" /> ORIGINAL PRICE / MRP (₹)
                    </label>
                    <input
                      type="number"
                      value={editingProduct ? editingProduct.originalPrice : newProduct.originalPrice}
                      onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) }) : setNewProduct({ ...newProduct, originalPrice: Number(e.target.value) })}
                      className="w-full border border-gray-200 p-5 font-black text-xl outline-none focus:bg-gray-50"
                      placeholder="MRP"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase">AVAILABILITY MATRIX (eg. S-5, M-6)</label>
                    <input 
                      type="text" 
                      value={selectedSizes.join(', ')} 
                      onChange={e => setSelectedSizes(e.target.value.split(',').map(v => v.trim()).filter(v => v))} 
                      className="w-full border border-gray-200 p-5 font-black text-xl outline-none focus:bg-gray-50 uppercase" 
                      placeholder="S-5, M-6, L-10, XL-2" 
                    />
                  </div>
                  <div className="space-y-6">
                    <label className="text-[10px] font-black uppercase">GLOBAL STATUS</label>
                    <div className="flex gap-4">
                      <button type="button" onClick={() => setIsSoldOutToggle(!isSoldOutToggle)} className={`flex-1 p-6 border-4 font-black text-[10px] uppercase transition-all shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-2 ${isSoldOutToggle ? 'bg-red-600 text-white border-black' : 'bg-green-600 text-white border-black'}`}>
                        <span>{isSoldOutToggle ? 'SOLD OUT' : 'IN STOCK'}</span>
                      </button>
                      <button type="button" onClick={() => setIsFeaturedToggle(!isFeaturedToggle)} className={`flex-1 p-6 border-4 font-black text-[10px] uppercase transition-all shadow-sm transition-all active:scale-95 flex items-center justify-center space-x-2 ${isFeaturedToggle ? 'bg-yellow-400 text-black border-black shadow-[4px_4px_0px_black]' : 'bg-white text-zinc-300 border-zinc-100'}`}>
                        <HomeIcon className={`w-4 h-4 ${isFeaturedToggle ? 'fill-black' : ''}`} />
                        <span>{isFeaturedToggle ? 'FEATURED' : 'NOT FEATURED'}</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">FRONT VIEW ASSET</label>
                    <div onClick={() => frontFileInputRef.current?.click()} className="relative border-4 border-dashed border-black aspect-[4/5] flex flex-col items-center justify-center bg-gray-50 cursor-pointer overflow-hidden group transition-all hover:bg-gray-50">
                      {frontPreview ? (
                        <>
                          <img src={frontPreview} className="w-full h-full object-cover" alt="Front Preview" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2">
                            <RefreshCw className="w-8 h-8" />
                            <span className="text-[9px] font-black uppercase tracking-widest">REPLACE ASSET</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2 group-hover:text-black transition-colors" />
                          <p className="text-[8px] font-black uppercase">UPLOAD FRONT</p>
                        </div>
                      )}
                      <input type="file" ref={frontFileInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'front')} />
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">BACK VIEW ASSET</label>
                    <div onClick={() => backFileInputRef.current?.click()} className="relative border-4 border-dashed border-black aspect-[4/5] flex flex-col items-center justify-center bg-gray-50 cursor-pointer overflow-hidden group transition-all hover:bg-gray-50">
                      {backPreview ? (
                        <>
                          <img src={backPreview} className="w-full h-full object-cover" alt="Back Preview" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white space-y-2">
                            <RefreshCw className="w-8 h-8" />
                            <span className="text-[9px] font-black uppercase tracking-widest">REPLACE ASSET</span>
                          </div>
                        </>
                      ) : (
                        <div className="text-center">
                          <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2 group-hover:text-black transition-colors" />
                          <p className="text-[8px] font-black uppercase">UPLOAD BACK</p>
                        </div>
                      )}
                      <input type="file" ref={backFileInputRef} className="hidden" accept="image/*" onChange={e => handleImageUpload(e, 'back')} />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-end mb-2">
                    <label className="text-[10px] font-black uppercase">DROP LORE</label>
                    <button 
                      type="button" 
                      onClick={() => handleAutoWriteDescription(false)}
                      className="text-[9px] font-black uppercase text-yellow-600 hover:text-black transition-colors flex items-center space-x-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Genie-Write</span>
                    </button>
                  </div>
                  <textarea required value={editingProduct ? editingProduct.description : newProduct.description} onChange={e => editingProduct ? setEditingProduct({ ...editingProduct, description: e.target.value }) : setNewProduct({ ...newProduct, description: e.target.value })} className="w-full border border-gray-200 p-6 font-black uppercase text-sm h-32 outline-none focus:bg-gray-50" placeholder="Product Story / Details..." />
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <button type="button" onClick={() => { setShowAddProduct(false); setEditingProduct(null); setNewProduct(INITIAL_NEW_PRODUCT); }} className="bg-gray-100 p-6 font-black uppercase text-xs hover:bg-gray-200 transition-colors">Abort</button>
                  <button type="submit" className="bg-black text-white p-6 font-black uppercase text-xs shadow-sm transition-all hover:bg-black text-white hover:bg-gray-800 active:scale-95 transition-all">EXECUTE DROP</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed.inset-0, .fixed.inset-0 * {
            visibility: visible;
          }
          .fixed.inset-0 {
            position: absolute !important;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            background: white !important;
            z-index: 99999 !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .shadow-sm transition-all {
            box-shadow: none !important;
            border: 1px solid black !important;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;