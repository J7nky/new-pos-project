import React, { useState, useRef } from 'react';
import { usePOS } from '../contexts/POSContext';
import { useAuth } from '../contexts/AuthContext';
import { useDolibarr } from '../contexts/DolibarrContext';
import { Search, Plus, Minus, Trash2, User, CreditCard, DollarSign, Smartphone, ScanLine, ShoppingCart, Receipt, Scale, Calculator, Table as Tabs, X } from 'lucide-react';

interface CartTab {
  id: string;
  name: string;
  items: any[];
  customerId?: string;
  total: number;
}

export const EnhancedPOSInterface: React.FC = () => {
  const { state, dispatch } = usePOS();
  const { state: authState } = useAuth();
  const { syncSale } = useDolibarr();
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showWeightModal, setShowWeightModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [weight, setWeight] = useState('');
  const [customPrice, setCustomPrice] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountReceived, setAmountReceived] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [activeTabId, setActiveTabId] = useState('tab1');
  const [tabs, setTabs] = useState<CartTab[]>([
    { id: 'tab1', name: 'Bill 1', items: [], total: 0 }
  ]);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const filteredProducts = state.products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.includes(searchTerm)
  );

  const activeTab = tabs.find(tab => tab.id === activeTabId) || tabs[0];
  const cartTotal = activeTab.items.reduce((sum: number, item: any) => sum + item.subtotal, 0);

  const addNewTab = () => {
    const newTab: CartTab = {
      id: `tab${Date.now()}`,
      name: `Bill ${tabs.length + 1}`,
      items: [],
      total: 0
    };
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTabId === tabId) {
      setActiveTabId(newTabs[0].id);
    }
  };

  const updateTabItems = (tabId: string, items: any[]) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, items, total: items.reduce((sum, item) => sum + item.subtotal, 0) }
        : tab
    ));
  };

  const handleAddToCart = (product: any, quantity: number = 1, customPriceValue?: number) => {
    if (product.stock < quantity) {
      alert('Insufficient stock!');
      return;
    }

    const price = customPriceValue || product.price;
    const existingItem = activeTab.items.find((item: any) => item.product.id === product.id);
    
    let newItems;
    if (existingItem) {
      newItems = activeTab.items.map((item: any) =>
        item.product.id === product.id
          ? {
              ...item,
              quantity: item.quantity + quantity,
              subtotal: (item.quantity + quantity) * price
            }
          : item
      );
    } else {
      newItems = [...activeTab.items, {
        product: { ...product, price },
        quantity,
        subtotal: quantity * price
      }];
    }

    updateTabItems(activeTabId, newItems);
  };

  const handleWeightBasedSale = () => {
    if (!selectedProduct || !weight) return;
    
    const weightValue = parseFloat(weight);
    const priceValue = customPrice ? parseFloat(customPrice) : selectedProduct.price;
    
    handleAddToCart(selectedProduct, weightValue, priceValue);
    setShowWeightModal(false);
    setWeight('');
    setCustomPrice('');
    setSelectedProduct(null);
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
      const newItems = activeTab.items.filter((item: any) => item.product.id !== productId);
      updateTabItems(activeTabId, newItems);
    } else {
      const newItems = activeTab.items.map((item: any) =>
        item.product.id === productId
          ? {
              ...item,
              quantity: newQuantity,
              subtotal: newQuantity * item.product.price
            }
          : item
      );
      updateTabItems(activeTabId, newItems);
    }
  };

  const handleProcessSale = () => {
    if (activeTab.items.length === 0) {
      alert('Cart is empty!');
      return;
    }

    const received = parseFloat(amountReceived) || cartTotal;
    if (paymentMethod === 'cash' && received < cartTotal) {
      alert('Insufficient amount received!');
      return;
    }

    const sale = {
      id: Date.now().toString(),
      customerId: activeTab.customerId,
      items: activeTab.items,
      total: cartTotal,
      paymentMethod,
      timestamp: new Date(),
      receiptNumber: `R${Date.now().toString().slice(-6)}`,
      cashier: authState.user?.name || 'Unknown'
    };

    dispatch({ type: 'PROCESS_SALE', payload: sale });
    
    // Sync with Dolibarr if configured
    try {
      await syncSale(sale);
    } catch (error) {
      console.warn('Failed to sync sale with Dolibarr:', error);
      // Continue with local processing even if Dolibarr sync fails
    }
    
    // Clear the active tab
    updateTabItems(activeTabId, []);
    
    setShowPaymentModal(false);
    setAmountReceived('');
    
    // Print receipt
    printReceipt(sale);
  };

  const printReceipt = (sale: any) => {
    const receiptContent = `
      VEGGIE MARKET POS
      Wholesale Vegetable Market
      ========================
      
      Receipt #: ${sale.receiptNumber}
      Date: ${new Date(sale.timestamp).toLocaleString()}
      Cashier: ${sale.cashier}
      Customer: ${activeTab.customerId 
        ? state.customers.find(c => c.id === activeTab.customerId)?.name || 'Unknown'
        : 'Walk-in Customer'
      }
      
      Items:
      ${sale.items.map((item: any) => 
        `${item.product.name} - ${item.quantity} ${item.product.unit} @ L.L.${item.product.price.toLocaleString()} = L.L.${item.subtotal.toLocaleString()}`
      ).join('\n')}
      
      ========================
      Total: L.L.${sale.total.toLocaleString()}
      Payment: ${sale.paymentMethod}
      ${paymentMethod === 'cash' && amountReceived ? `Received: L.L.${parseFloat(amountReceived).toLocaleString()}` : ''}
      ${paymentMethod === 'cash' && amountReceived && parseFloat(amountReceived) > cartTotal ? `Change: L.L.${(parseFloat(amountReceived) - cartTotal).toLocaleString()}` : ''}
      
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
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <span className="text-sm bg-gray-100 px-2 py-1 rounded">{product.category}</span>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <p className="text-lg font-bold text-green-600">L.L.{product.price.toLocaleString()}/{product.unit}</p>
                    <p className="text-sm text-gray-600">Stock: {product.stock} {product.unit}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="flex-1 p-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </button>
                  <button
                    onClick={() => {
                      setSelectedProduct(product);
                      setShowWeightModal(true);
                    }}
                    className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    <Scale className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      const price = prompt('Enter custom price:', product.price.toString());
                      if (price) {
                        handleAddToCart(product, 1, parseFloat(price));
                      }
                    }}
                    className="p-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    <Calculator className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart with Tabs */}
      <div className="space-y-4">
        {/* Tab Navigation */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2 overflow-x-auto">
              {tabs.map((tab) => (
                <div key={tab.id} className="flex items-center">
                  <button
                    onClick={() => setActiveTabId(tab.id)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                      activeTabId === tab.id
                        ? 'bg-green-100 text-green-700'
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    {tab.name}
                  </button>
                  {tabs.length > 1 && (
                    <button
                      onClick={() => closeTab(tab.id)}
                      className="ml-1 p-1 text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              onClick={addNewTab}
              className="p-2 text-green-600 hover:text-green-700"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Customer Selection */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium text-gray-900">Customer</h3>
              <button
                onClick={() => setShowCustomerModal(true)}
                className="text-green-600 hover:text-green-700"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
            {activeTab.customerId ? (
              <div className="text-sm">
                <p className="font-medium">
                  {state.customers.find(c => c.id === activeTab.customerId)?.name}
                </p>
                <p className="text-gray-600">
                  {state.customers.find(c => c.id === activeTab.customerId)?.phone}
                </p>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Walk-in Customer</p>
            )}
          </div>
        </div>

        {/* Cart Items */}
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200 flex-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">Cart</h3>
            <span className="text-sm text-gray-600">{activeTab.items.length} items</span>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {activeTab.items.map((item: any) => (
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
                    onClick={() => {
                      const newItems = activeTab.items.filter((i: any) => i.product.id !== item.product.id);
                      updateTabItems(activeTabId, newItems);
                    }}
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

          {activeTab.items.length === 0 && (
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
              onClick={() => updateTabItems(activeTabId, [])}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Clear
            </button>
            <button
              onClick={() => setShowPaymentModal(true)}
              disabled={activeTab.items.length === 0}
              className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Checkout
            </button>
          </div>
        </div>
      </div>

      {/* Weight Modal */}
      {showWeightModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Weight-based Sale</h3>
            
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-900">{selectedProduct?.name}</p>
                <p className="text-sm text-gray-600">L.L.{selectedProduct?.price.toLocaleString()}/{selectedProduct?.unit}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight ({selectedProduct?.unit})</label>
                <input
                  type="number"
                  step="0.01"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter weight"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Custom Price (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder={`Default: L.L.${selectedProduct?.price.toLocaleString()}`}
                />
              </div>

              {weight && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-600">Total Amount:</p>
                  <p className="text-lg font-bold text-green-600">
                    L.L.{((parseFloat(weight) || 0) * (parseFloat(customPrice) || selectedProduct?.price || 0)).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowWeightModal(false);
                  setWeight('');
                  setCustomPrice('');
                  setSelectedProduct(null);
                }}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleWeightBasedSale}
                disabled={!weight}
                className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Select Customer</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              <button
                onClick={() => {
                  setTabs(tabs.map(tab => 
                    tab.id === activeTabId 
                      ? { ...tab, customerId: undefined }
                      : tab
                  ));
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
                    setTabs(tabs.map(tab => 
                      tab.id === activeTabId 
                        ? { ...tab, customerId: customer.id }
                        : tab
                    ));
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