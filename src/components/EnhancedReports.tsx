import React, { useState } from 'react';
import { usePOS } from '../contexts/POSContext';
import { useSupplier } from '../contexts/SupplierContext';
import { useFinance } from '../contexts/FinanceContext';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Package,
  Users,
  ShoppingCart,
  FileText,
  Printer
} from 'lucide-react';

export const EnhancedReports: React.FC = () => {
  const { state: posState } = usePOS();
  const { state: supplierState } = useSupplier();
  const { state: financeState } = useFinance();
  const [selectedPeriod, setSelectedPeriod] = useState('today');
  const [selectedReport, setSelectedReport] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const getFilteredSales = () => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return posState.sales.filter(sale => {
      const saleDate = new Date(sale.timestamp);
      switch (selectedPeriod) {
        case 'today':
          return saleDate >= today;
        case 'week':
          return saleDate >= thisWeek;
        case 'month':
          return saleDate >= thisMonth;
        case 'custom':
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return saleDate >= startDate && saleDate <= endDate;
        default:
          return true;
      }
    });
  };

  const filteredSales = getFilteredSales();
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  // Enhanced analytics
  const totalExpenses = financeState.expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  // Product analysis
  const productSales = posState.products.map(product => {
    const totalSold = filteredSales.reduce((sum, sale) => {
      const item = sale.items.find(item => item.product.id === product.id);
      return sum + (item ? item.quantity : 0);
    }, 0);
    const totalRevenue = filteredSales.reduce((sum, sale) => {
      const item = sale.items.find(item => item.product.id === product.id);
      return sum + (item ? item.subtotal : 0);
    }, 0);
    return { ...product, totalSold, totalRevenue };
  }).sort((a, b) => b.totalSold - a.totalSold);

  // Customer analysis
  const customerStats = posState.customers.map(customer => {
    const customerSales = filteredSales.filter(sale => sale.customerId === customer.id);
    const totalSpent = customerSales.reduce((sum, sale) => sum + sale.total, 0);
    const totalOrders = customerSales.length;
    const lastPurchase = customerSales.length > 0 
      ? new Date(Math.max(...customerSales.map(s => new Date(s.timestamp).getTime())))
      : null;
    return { ...customer, totalSpent, totalOrders, lastPurchase };
  }).sort((a, b) => b.totalSpent - a.totalSpent);

  // Supplier analysis
  const supplierStats = supplierState.suppliers.map(supplier => {
    const supplierExpenses = financeState.expenses.filter(e => e.supplierId === supplier.id);
    const totalPaid = supplierExpenses.reduce((sum, e) => sum + e.amount, 0);
    return { ...supplier, totalPaid };
  });

  // Inventory movement
  const inventoryMovement = posState.products.map(product => {
    const sold = filteredSales.reduce((sum, sale) => {
      const item = sale.items.find(item => item.product.id === product.id);
      return sum + (item ? item.quantity : 0);
    }, 0);
    const turnoverRate = product.stock > 0 ? sold / product.stock : 0;
    return { ...product, sold, turnoverRate };
  }).sort((a, b) => b.turnoverRate - a.turnoverRate);

  const exportReport = (format: 'json' | 'csv' | 'pdf') => {
    const reportData = {
      period: selectedPeriod,
      dateRange: selectedPeriod === 'custom' ? dateRange : null,
      summary: {
        totalRevenue,
        totalExpenses,
        netProfit,
        profitMargin,
        totalTransactions,
        averageTransaction
      },
      topProducts: productSales.slice(0, 10),
      topCustomers: customerStats.slice(0, 10),
      suppliers: supplierStats,
      inventoryMovement: inventoryMovement.slice(0, 10),
      sales: filteredSales
    };

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(reportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'csv') {
      // Simple CSV export for sales data
      const csvContent = [
        ['Receipt', 'Date', 'Customer', 'Items', 'Total', 'Payment'],
        ...filteredSales.map(sale => [
          sale.receiptNumber,
          new Date(sale.timestamp).toLocaleDateString(),
          sale.customerId 
            ? posState.customers.find(c => c.id === sale.customerId)?.name || 'Unknown'
            : 'Walk-in Customer',
          sale.items.length,
          sale.total,
          sale.paymentMethod
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedReport}-report-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const printReport = () => {
    const printContent = `
      <html>
        <head>
          <title>${selectedReport.toUpperCase()} Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 30px; }
            .summary-card { border: 1px solid #ddd; padding: 15px; border-radius: 5px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f5f5f5; }
            .section { margin-bottom: 30px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VeggieMarket POS - ${selectedReport.toUpperCase()} Report</h1>
            <p>Period: ${selectedPeriod} | Generated: ${new Date().toLocaleString()}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <h3>Revenue</h3>
              <p>L.L.${totalRevenue.toLocaleString()}</p>
            </div>
            <div class="summary-card">
              <h3>Transactions</h3>
              <p>${totalTransactions}</p>
            </div>
            <div class="summary-card">
              <h3>Net Profit</h3>
              <p>L.L.${netProfit.toLocaleString()}</p>
            </div>
          </div>

          <div class="section">
            <h2>Top Products</h2>
            <table>
              <tr><th>Product</th><th>Sold</th><th>Revenue</th></tr>
              ${productSales.slice(0, 10).map(p => 
                `<tr><td>${p.name}</td><td>${p.totalSold} ${p.unit}</td><td>L.L.${p.totalRevenue.toLocaleString()}</td></tr>`
              ).join('')}
            </table>
          </div>

          <div class="section">
            <h2>Recent Sales</h2>
            <table>
              <tr><th>Receipt</th><th>Date</th><th>Customer</th><th>Total</th></tr>
              ${filteredSales.slice(0, 20).map(s => 
                `<tr>
                  <td>${s.receiptNumber}</td>
                  <td>${new Date(s.timestamp).toLocaleDateString()}</td>
                  <td>${s.customerId ? posState.customers.find(c => c.id === s.customerId)?.name || 'Unknown' : 'Walk-in'}</td>
                  <td>L.L.${s.total.toLocaleString()}</td>
                </tr>`
              ).join('')}
            </table>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Enhanced Reports</h1>
          <p className="text-gray-600">Comprehensive business analytics and reporting</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="sales">Sales Report</option>
            <option value="inventory">Inventory Report</option>
            <option value="customer">Customer Report</option>
            <option value="financial">Financial Report</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom Range</option>
            <option value="all">All Time</option>
          </select>
          <div className="flex space-x-2">
            <button
              onClick={() => exportReport('json')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>JSON</span>
            </button>
            <button
              onClick={() => exportReport('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <FileText className="w-4 h-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={printReport}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {selectedPeriod === 'custom' && (
        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-200">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">L.L.{totalRevenue.toLocaleString()}</p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Expenses</p>
              <p className="text-2xl font-bold text-red-600">L.L.{totalExpenses.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Net Profit</p>
              <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                L.L.{netProfit.toLocaleString()}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Profit Margin</p>
              <p className={`text-2xl font-bold ${profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {profitMargin.toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Transactions</p>
              <p className="text-2xl font-bold text-blue-600">{totalTransactions}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Report Content Based on Selection */}
      {selectedReport === 'sales' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Products */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
            <div className="space-y-3">
              {productSales.slice(0, 10).map((product, index) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-green-600 font-semibold">{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">{product.totalSold} {product.unit} sold</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">L.L.{product.totalRevenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-600">Revenue</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sales Trend */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {filteredSales.slice(0, 10).map((sale) => (
                <div key={sale.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{sale.receiptNumber}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(sale.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">L.L.{sale.total.toLocaleString()}</p>
                    <p className="text-sm text-gray-600 capitalize">{sale.paymentMethod}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedReport === 'inventory' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Movement Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Product</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Current Stock</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Sold</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Turnover Rate</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {inventoryMovement.map((product) => (
                  <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{product.name}</td>
                    <td className="py-3 px-4">{product.stock} {product.unit}</td>
                    <td className="py-3 px-4">{product.sold} {product.unit}</td>
                    <td className="py-3 px-4">{(product.turnoverRate * 100).toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      {product.stock <= product.minStock ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          In Stock
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'customer' && (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Analysis</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total Spent</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Orders</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Last Purchase</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Balance</th>
                </tr>
              </thead>
              <tbody>
                {customerStats.map((customer) => (
                  <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        customer.type === 'wholesale' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {customer.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold">L.L.{customer.totalSpent.toLocaleString()}</td>
                    <td className="py-3 px-4">{customer.totalOrders}</td>
                    <td className="py-3 px-4">
                      {customer.lastPurchase 
                        ? customer.lastPurchase.toLocaleDateString()
                        : 'Never'
                      }
                    </td>
                    <td className="py-3 px-4">
                      <span className={`font-medium ${
                        customer.balance > 0 ? 'text-red-600' : 'text-green-600'
                      }`}>
                        L.L.{customer.balance.toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedReport === 'financial' && (
        <div className="space-y-6">
          {/* Profit & Loss Summary */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profit & Loss Statement</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                <span className="font-medium text-green-900">Total Revenue</span>
                <span className="font-bold text-green-900">L.L.{totalRevenue.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                <span className="font-medium text-red-900">Total Expenses</span>
                <span className="font-bold text-red-900">L.L.{totalExpenses.toLocaleString()}</span>
              </div>
              <div className="border-t border-gray-200 pt-3">
                <div className={`flex justify-between items-center p-3 rounded-lg ${
                  netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'
                }`}>
                  <span className={`font-bold text-lg ${
                    netProfit >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    Net Profit
                  </span>
                  <span className={`font-bold text-xl ${
                    netProfit >= 0 ? 'text-green-900' : 'text-red-900'
                  }`}>
                    L.L.{netProfit.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Expense Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {financeState.expenseCategories.map(category => {
                const categoryTotal = financeState.expenses
                  .filter(e => e.category === category)
                  .reduce((sum, e) => sum + e.amount, 0);
                
                return (
                  <div key={category} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{category}</span>
                      <span className="text-lg font-bold text-gray-900">
                        L.L.{categoryTotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ 
                            width: totalExpenses > 0 ? `${(categoryTotal / totalExpenses) * 100}%` : '0%' 
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};