import React, { useState, useRef } from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  CreditCard,
  DollarSign,
  Smartphone,
  ScanLine,
  ShoppingCart,
  Receipt
} from 'lucide-react';

export const POSInterface: React.FC = () => {
  const { state, dispatch } = usePOS();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const cartTotal = state.cart.reduce((sum, item) => sum + item.subtotal, 0);

  const handleAddToCart = (product: any, quantity: number = 1) => {
    if (product.stock < quantity) {
      alert('Insufficient stock!');
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: { product, quantity }
    });
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = state.products.find(p => p.barcode === barcodeInput);
    if (product) {
      handleAddToCart(product);
      setBarcodeInput('');
    } else {
      alert('Product not found!');
    }
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    } else {
      dispatch({
        type: 'UPDATE_CART_ITEM',
        payload: { productId, quantity: newQuantity }
      });
    }
  };

  const handleProcessSale = () => {
    if (state.cart.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const received = parseFloat(amountReceived) || cartTotal;
    if (received < cartTotal) {
      alert('Insufficient amount received!');
      return;
    }

    const sale = {
      id: Date.now().toString(),
      customerId: state.selectedCustomer?.id,
      items: state.cart,
      total: cartTotal,
      paymentMethod,
      timestamp: new Date(),
      receiptNumber: `R${Date.now().toString().slice(-6)}`
    };

    dispatch({ type: 'PROCESS_SALE', payload: sale });
    setShowPaymentModal(false);
    setAmountReceived('');
    
    // Simulate printing receipt
    printReceipt(sale);
  };

  const printReceipt = (sale: any) => {
    const receiptContent = `
      VEGGIE MARKET POS
      Wholesale Vegetable Market
      ========================
      
      Receipt #: ${sale.receiptNumber}
      Date: ${new Date(sale.timestamp).toLocaleString()}
      Customer: ${state.selectedCustomer?.name || 'Walk-in Customer'}
      
      Items:
      ${sale.items.map((item: any) => 
        `${item.product.name} - ${item.quantity} ${item.product.unit} @ L.L.${item.product.price.toLocaleString()} = L.L.${item.subtotal.toLocaleString()}`
      ).join('\n')}
      
      ========================
      Total: L.L.${sale.total.toLocaleString()}
      Payment: ${sale.paymentMethod}
      
      Thank you for your business!
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Receipt</title>
            <style>
              body { font-family: 'Courier New', monospace; font-size: 12px; }
              pre { white-space: pre-wrap; }
            </style>
          </head>
          <body>
            <pre>${receiptContent}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
      {/* Left Panel - Products */}
      <div className="lg:col-span-2 space-y-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Products</h2>
          
          {/* Search and Barcode */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <form onSubmit={handleBarcodeSubmit} className="flex gap-2">
              <div className="relative">
                <ScanLine className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  ref={barcodeRef}
                  type="text"
                  placeholder="Scan barcode"
                  value={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Add
              </button>
            </form>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAddToCart(product)}
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-lg font-bold text-green-600">L.L.{product.price.toLocaleString()}/{product.unit}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock} {product.unit}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="space-y-4">
        {/* Customer Selection */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-gray-900">Customer</h3>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="text-green-600 hover:text-green-700"
            >
              <User className="w-4 h-4" />
            </button>
          </div>
          {state.selectedCustomer ? (
            <div className="text-sm">
              <p className="font-medium">{state.selectedCustomer.name}</p>
              <p className="text-gray-600">{state.selectedCustomer.phone}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">Walk-in Customer</p>
          )}
        </div>

        {/* Cart */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Cart</h3>
            <span className="text-sm text-gray-600">{state.cart.length} items</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {state.cart.map((item) => (
              <div key={item.product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{item.product.name}</p>
                  <p className="text-sm text-gray-600">L.L.{item.product.price.toLocaleString()}/{item.product.unit}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                    className="p-1 text-gray-600 hover:text-gray-800"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'REMOVE_FROM_CART', payload: item.product.id })}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-right ml-4">
                  <p className="font-medium">L.L.{item.subtotal.toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>

          {state.cart.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>Cart is empty</p>
            </div>
          )}
        </div>

        {/* Total and Checkout */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-semibold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-green-600">L.L.{cartTotal.toLocaleString()}</span>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => dispatch({ type: 'CLEAR_CART' })}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={state.cart.length === 0}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Customer</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: undefined });
                  setShowCustomerModal(false);
                }}
                className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Walk-in Customer
              </button>
              {state.customers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => {
                    dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: customer });
                    setShowCustomerModal(false);
                  }}
                  className="w-full p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-600">{customer.phone}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowCustomerModal(false)}
              className="w-full mt-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Payment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('cash')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center ${
                      paymentMethod === 'cash' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <DollarSign className="w-5 h-5 mr-2" />
                    Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod('card')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center ${
                      paymentMethod === 'card' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 mr-2" />
                    Card
                  </button>
                  <button
                    onClick={() => setPaymentMethod('upi')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center ${
                      paymentMethod === 'upi' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Smartphone className="w-5 h-5 mr-2" />
                    UPI
                  </button>
                  <button
                    onClick={() => setPaymentMethod('credit')}
                    className={`p-3 rounded-lg border-2 flex items-center justify-center ${
                      paymentMethod === 'credit' 
                        ? 'border-green-500 bg-green-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Receipt className="w-5 h-5 mr-2" />
                    Credit
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Total Amount</label>
                <div className="text-2xl font-bold text-green-600 mb-2">L.L.{cartTotal.toLocaleString()}</div>
              </div>

              {paymentMethod === 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount Received</label>
                  <input
                    type="number"
                    value={amountReceived}
                    onChange={(e) => setAmountReceived(e.target.value)}
                    placeholder={cartTotal.toString()}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  {amountReceived && parseFloat(amountReceived) > cartTotal && (
                    <p className="text-sm text-gray-600 mt-1">
                      Change: L.L.{(parseFloat(amountReceived) - cartTotal).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleProcessSale}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Process Sale
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};