import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Truck, CheckCircle2, CreditCard, ShieldCheck } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { Order } from '../types';
import { saveOrder } from '../services/orderService';
import { apiUrl } from '../utils/apiUrl';

type PaymentMethod = 'razorpay' | 'cod';

const Checkout: React.FC = () => {
  const { cart, cartTotal, clearCart, shippingPrice, grandTotal } = useCart();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('razorpay');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string>('');
  const [rzpKey, setRzpKey] = useState<string>('rzp_live_SFDpDwe3qxYPFL');
  
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, amount: number} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  // Initialize order ID once per session/cart
  useEffect(() => {
    if (!currentOrderId) {
      setCurrentOrderId('KT-' + Math.random().toString(36).substr(2, 9).toUpperCase());
    }
  }, []);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateField = (name: string, value: string) => {
    let error = '';
    if (!value) {
      error = 'Required field.';
    } else if (name === 'email' && !/\S+@\S+\.\S+/.test(value)) {
      error = 'Invalid email format.';
    } else if (name === 'phone' && value.length !== 10) {
      error = 'Phone must be 10 digits.';
    } else if (name === 'pincode' && value.length !== 6) {
      error = 'Pincode must be 6 digits.';
    }
    setErrors(prev => ({ ...prev, [name]: error }));
    return error === '';
  };



  useEffect(() => {
    if (cart.length === 0 && !submitted) {
      navigate('/cart');
    }
  }, [cart.length, submitted, navigate]);

  if (cart.length === 0 && !submitted) {
    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'phone' || name === 'pincode') {
      const numericValue = value.replace(/[^0-9]/g, '');
      if (name === 'phone' && numericValue.length > 10) return;
      if (name === 'pincode' && numericValue.length > 6) return;
      setFormData({ ...formData, [name]: numericValue });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Abandoned Cart Recovery Hook: Sync whenever phone is 10 digits
    if (name === 'phone' && value.length === 10) {
      fetch(apiUrl('sync_abandoned.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: value,
          name: formData.name,
          cart: cart
        })
      }).catch(() => console.log("Recovery sync failed (silent)"));
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    validateField(e.target.name, e.target.value);
  };

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setIsApplyingCoupon(true);
    setCouponError('');
    try {
      const res = await fetch(apiUrl('coupons.php?action=validate'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponInput })
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: couponInput, amount: data.amount });
      } else {
        setCouponError(data.message || 'Invalid coupon.');
        setAppliedCoupon(null);
      }
    } catch(e) {
      setCouponError('Error verifying coupon.');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const finalTotal = Math.max(0, grandTotal - (appliedCoupon?.amount || 0));

  const processOrderSubmission = async (methodLabel: string, screenshot?: string, overrideId?: string, paymentId?: string, paymentStatus: string = 'Pending') => {
    try {
      setIsRedirecting(true);
      const generatedOrderId = overrideId || ('KT-' + Math.random().toString(36).substr(2, 9).toUpperCase());
      const newOrder: Order = {
        id: generatedOrderId,
        date: new Date().toISOString(),
        customer: formData,
        items: [...cart],
        total: finalTotal,
        shipping_price: shippingPrice,
        status: 'Pending',
        paymentMethod: methodLabel,
        paymentScreenshot: screenshot,
        payment_id: paymentId,
        payment_status: paymentStatus,
        couponCode: appliedCoupon?.code
      };

      const result = await saveOrder(newOrder);
      if (result.success) {
        if (finalTotal >= 2000) {
          try {
            const res = await fetch(apiUrl('settings.php?key=vault_passkey'));
            const data = await res.json();
            const passkey = data.value || 'TOWNLEGEND';
            localStorage.setItem('knotty_passkey', passkey);
          } catch (e) {
            localStorage.setItem('knotty_passkey', 'TOWNLEGEND');
          }
        }

        setTimeout(() => {
          setIsRedirecting(false);
          setOrderId(generatedOrderId);
          setSubmitted(true);
          clearCart();
        }, 2000);
      } else {
        setIsRedirecting(false);
        const errorMsg = result.error || "UNKNOWN ERROR";
        alert(`SYNC ERROR: ${errorMsg}`);
      }
    } catch (e) {
      console.error("Submission Crash", e);
      setIsRedirecting(false);
      alert("System err. Please try again.");
    }
  };

  const handleRazorpayPayment = async (internalOrderId: string) => {
    if (!rzpKey) {
      alert("Payment configuration missing. Contact Support.");
      setIsRedirecting(false);
      return;
    }

    try {
      const orderRes = await fetch(apiUrl('create_razorpay_order.php'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(finalTotal * 100),
          receipt: internalOrderId
        })
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json();
        throw new Error(errData.error || "Order creation failed");
      }

      const orderData = await orderRes.json();
      const razorpayOrderId = orderData.id;

      if (!razorpayOrderId) throw new Error("No Order ID received from Razorpay");

      const options = {
        key: rzpKey,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'KNOTTY TOWN',
        description: 'Selected Collection',
        order_id: razorpayOrderId,
        handler: async function (response: any) {
          setIsRedirecting(true);
          try {
            const verifyRes = await fetch(apiUrl('verify_payment.php'), {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                order_id: internalOrderId
              })
            });

            const verifyData = await verifyRes.json();

            if (verifyData.status === 'success') {
              // Successfully verified, now finalize UI
              if (finalTotal >= 2000) {
                try {
                  const res = await fetch(apiUrl('settings.php?key=vault_passkey'));
                  const data = await res.json();
                  const passkey = data.value || 'TOWNLEGEND';
                  localStorage.setItem('knotty_passkey', passkey);
                } catch (e) {
                  localStorage.setItem('knotty_passkey', 'TOWNLEGEND');
                }
              }

              setIsRedirecting(false);
              setOrderId(internalOrderId);
              setSubmitted(true);
              clearCart();
            } else {
              alert("Payment verification failed: " + verifyData.message);
            }
          } catch (e) {
            console.error("Verification Error", e);
            alert("Error during verification. Contact Support.");
          } finally {
            setIsRedirecting(false);
          }
        },
        prefill: {
          name: formData.name,
          email: formData.email,
          contact: formData.phone
        },
        theme: {
          color: '#2d3435'
        },
        modal: {
          ondismiss: function () {
            setIsRedirecting(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (response: any) {
        alert("Payment Failed: " + response.error.description);
        setIsRedirecting(false);
      });
      rzp.open();

    } catch (err: any) {
      console.error("Payment Start Error", err);
      alert("Payment startup failed: " + (err.message || "Unknown error"));
      setIsRedirecting(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    let isValid = true;

    Object.keys(formData).forEach(key => {
      const value = (formData as any)[key];
      if (!value) {
        newErrors[key] = `Required field.`;
        isValid = false;
      }
    });

    if (formData.phone && formData.phone.length !== 10) { newErrors.phone = "Enter a valid 10-digit phone number."; isValid = false; }
    if (formData.pincode && formData.pincode.length !== 6) { newErrors.pincode = "Enter a valid 6-digit pincode."; isValid = false; }

    setErrors(newErrors);

    if (!isValid) {
      const firstErrorField = Object.keys(newErrors)[0];
      const element = document.getElementsByName(firstErrorField)[0];
      if (element) element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setIsRedirecting(true);
    const generatedOrderId = currentOrderId;
    
    // 1. Create the order object (Initially Pending)
    const newOrder: Order = {
      id: generatedOrderId,
      date: new Date().toISOString(),
      customer: formData,
      items: [...cart],
      total: finalTotal,
      shipping_price: shippingPrice,
      status: 'Pending',
      paymentMethod: paymentMethod === 'razorpay' ? 'Razorpay' : 'Cash on Delivery',
      payment_status: 'Pending',
      couponCode: appliedCoupon?.code
    };

    // 2. Save Order to Database FIRST
    try {
      const result = await saveOrder(newOrder);
      if (!result.success) {
        throw new Error(result.error || "Failed to save order");
      }

      // 3. Proceed to Payment
      if (paymentMethod === 'razorpay') {
        handleRazorpayPayment(generatedOrderId);
      } else {
        // COD Success
        setTimeout(() => {
          setIsRedirecting(false);
          setOrderId(generatedOrderId);
          setSubmitted(true);
          clearCart();
        }, 1500);
      }
    } catch (err: any) {
      setIsRedirecting(false);
      alert(`ORDER FAILED: ${err.message}`);
    }
  };

  if (submitted) {
    return (
      <div className="bg-[#FAF9F6] min-h-screen pt-40 pb-24 flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <CheckCircle2 className="w-12 h-12 text-[#745b3b] mx-auto mb-6" />
          <h1 className="font-serif text-4xl text-black">Order Confirmed.</h1>
          <p className="text-sm font-light text-gray-500 leading-relaxed mb-8">
            Thank you for your purchase. We have received your order {orderId && <span className="text-black font-normal">{orderId}</span>} and are preparing it for shipment.
          </p>
          <button 
            onClick={() => navigate('/')} 
            className="w-full bg-[#5C5C5C] text-white py-4 text-[10px] uppercase tracking-[0.2em] hover:bg-black transition-colors"
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF9F6] min-h-screen pt-32 pb-24 relative">
      {isRedirecting && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-sm flex items-center justify-center">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 rounded-full border-[1px] border-gray-300 border-t-black animate-spin mb-4"></div>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Processing Transaction...</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-24">
        {/* Main Form */}
        <div className="lg:col-span-7">
          <div className="mb-12">
            <h1 className="font-serif text-4xl mb-2 text-black">Checkout</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-gray-400">Secure Payment & Details</p>
          </div>

          <form onSubmit={handlePaymentSubmit} className="space-y-16">
            <section>
              <h3 className="text-xs uppercase tracking-widest text-[#745b3b] font-medium mb-8 pb-3 border-b border-gray-200">1. Shipping Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <div className="space-y-1">
                  <input required name="name" value={formData.name} onChange={handleInputChange} onBlur={handleBlur} type="text" className={`w-full bg-transparent border-b py-3 text-sm focus:border-black outline-none transition-colors ${errors.name ? 'border-red-500' : 'border-gray-300'}`} placeholder="Full Name" />
                  {errors.name && <p className="text-[9px] text-red-500 uppercase tracking-widest pt-1">{errors.name}</p>}
                </div>
                <div className="space-y-1">
                  <input required name="email" value={formData.email} onChange={handleInputChange} onBlur={handleBlur} type="email" className={`w-full bg-transparent border-b py-3 text-sm focus:border-black outline-none transition-colors ${errors.email ? 'border-red-500' : 'border-gray-300'}`} placeholder="Email Address" />
                  {errors.email && <p className="text-[9px] text-red-500 uppercase tracking-widest pt-1">{errors.email}</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <input required name="phone" value={formData.phone} onChange={handleInputChange} onBlur={handleBlur} type="tel" inputMode="numeric" className={`w-full bg-transparent border-b py-3 text-sm focus:border-black outline-none transition-colors ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} placeholder="Phone Number" />
                  {errors.phone && <p className="text-[9px] text-red-500 uppercase tracking-widest pt-1">{errors.phone}</p>}
                </div>
                <div className="md:col-span-2 space-y-1">
                  <textarea required name="address" value={formData.address} onChange={handleInputChange} onBlur={handleBlur} className={`w-full bg-transparent border-b py-3 text-sm focus:border-black outline-none transition-colors h-24 resize-none ${errors.address ? 'border-red-500' : 'border-gray-300'}`} placeholder="Street Address"></textarea>
                  {errors.address && <p className="text-[9px] text-red-500 uppercase tracking-widest pt-1">{errors.address}</p>}
                </div>
                <div className="space-y-1">
                  <input required name="city" value={formData.city} onChange={handleInputChange} onBlur={handleBlur} type="text" className={`w-full bg-transparent border-b py-3 text-sm focus:border-black outline-none transition-colors ${errors.city ? 'border-red-500' : 'border-gray-300'}`} placeholder="City" />
                  {errors.city && <p className="text-[9px] text-red-500 uppercase tracking-widest pt-1">{errors.city}</p>}
                </div>
                <div className="space-y-1">
                  <input required name="pincode" value={formData.pincode} onChange={handleInputChange} onBlur={handleBlur} type="text" inputMode="numeric" className={`w-full bg-transparent border-b py-3 text-sm focus:border-black outline-none transition-colors ${errors.pincode ? 'border-red-500' : 'border-gray-300'}`} placeholder="Postal Code" />
                  {errors.pincode && <p className="text-[9px] text-red-500 uppercase tracking-widest pt-1">{errors.pincode}</p>}
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xs uppercase tracking-widest text-[#745b3b] font-medium mb-8 pb-3 border-b border-gray-200">2. Payment Method</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('razorpay')}
                  className={`p-6 border flex flex-col items-center justify-center transition-all ${paymentMethod === 'razorpay' ? 'border-black bg-white shadow-sm' : 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-400'}`}
                >
                  <CreditCard className="w-5 h-5 mb-3" strokeWidth={1} />
                  <span className="text-[10px] uppercase tracking-widest">Card / UPI</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cod')}
                  className={`p-6 border flex flex-col items-center justify-center transition-all ${paymentMethod === 'cod' ? 'border-black bg-white shadow-sm' : 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-400'}`}
                >
                  <Truck className="w-5 h-5 mb-3" strokeWidth={1} />
                  <span className="text-[10px] uppercase tracking-widest">Pay on Delivery</span>
                </button>
              </div>

              <div className="mt-12">
                <button type="submit" className="w-full py-5 bg-[#5C5C5C] text-white hover:bg-black transition-colors text-[10px] uppercase tracking-[0.2em] flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4 mr-3" />
                  Complete Purchase • ₹{finalTotal.toFixed(0)}
                </button>
                <p className="text-center mt-6 text-[9px] text-gray-400 uppercase tracking-widest">Your payment information is processed securely.</p>
              </div>
            </section>
          </form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-5">
          <div className="bg-white p-8 lg:p-10 border border-gray-100 lg:sticky lg:top-32 shadow-sm">
             <h3 className="font-serif text-xl mb-8 border-b border-gray-100 pb-4 text-black">Order Summary</h3>
             <div className="space-y-6 mb-8">
               {cart.map((item) => (
                 <div key={item.id} className="flex space-x-6">
                   <div className="relative w-20 h-24 bg-gray-50 overflow-hidden shrink-0">
                     <img src={item.image} className="w-full h-full object-cover" alt={item.name} />
                     <span className="absolute bottom-0 right-0 bg-white text-black text-[9px] px-2 py-1 font-medium">{item.quantity}</span>
                   </div>
                   <div className="flex-grow flex flex-col justify-center">
                     <h4 className="font-light text-sm text-black mb-1">{item.name}</h4>
                     <p className="text-[10px] text-gray-500 uppercase tracking-widest">₹{item.price}</p>
                   </div>
                 </div>
               ))}
             </div>
             
             <div className="space-y-4 pt-6 border-t border-gray-100">
               <div className="flex justify-between text-xs text-gray-500">
                 <span className="uppercase tracking-widest">Subtotal</span>
                 <span>₹{cartTotal.toFixed(0)}</span>
               </div>
               <div className="flex justify-between text-xs text-gray-500">
                 <span className="uppercase tracking-widest">Shipping</span>
                 <span>{shippingPrice === 0 ? 'Complimentary' : `₹${shippingPrice}`}</span>
               </div>
               <div className="flex justify-between pt-6 border-t border-gray-100 items-baseline">
                 <span className="font-serif text-lg text-black">Total</span>
                 <span className="font-serif text-2xl text-black">₹{finalTotal.toFixed(0)}</span>
               </div>
               
               <div className="pt-6 border-t border-gray-100">
                 <div className="flex items-center space-x-2">
                   <input type="text" value={couponInput} onChange={e=>setCouponInput(e.target.value.toUpperCase())} placeholder="Coupon Code" className="flex-grow bg-transparent border-b border-gray-300 py-2 text-sm focus:border-black outline-none transition-colors uppercase" disabled={!!appliedCoupon} />
                   <button type="button" onClick={handleApplyCoupon} disabled={!couponInput || isApplyingCoupon || !!appliedCoupon} className="px-4 py-2 bg-black text-white text-[10px] uppercase font-black disabled:opacity-50 min-w-24 border border-black">
                     {isApplyingCoupon ? '...' : appliedCoupon ? 'APPLIED' : 'APPLY'}
                   </button>
                 </div>
                 {couponError && <p className="text-[9px] text-red-500 uppercase mt-2">{couponError}</p>}
                 {appliedCoupon && (
                   <div className="flex justify-between items-center text-[10px] text-green-600 uppercase mt-4 font-black">
                     <span>Discount ({appliedCoupon.code})</span>
                     <div className="flex items-center">
                       <span>-₹{appliedCoupon.amount}</span>
                       <button onClick={()=>{setAppliedCoupon(null); setCouponInput('');}} type="button" className="ml-2 text-red-500 hover:text-red-700 text-sm">✖</button>
                     </div>
                   </div>
                 )}
               </div>

             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;

