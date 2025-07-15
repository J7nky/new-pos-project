import React from 'react';
import { usePOS } from '../contexts/POSContext';
import { 
  DollarSign, 
  TrendingUp, 
  Package, 
  AlertTriangle,
  Users,
  ShoppingCart
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { state } = usePOS();
  
  const totalSales = state.sales.reduce((sum, sale) => sum + sale.total, 0); 
  const todaySales = state.sales.filter(sale => {
    const today = new Date();
    const saleDate = new Date(sale.timestamp);
    return saleDate.toDateString() === today.toDateString();
  });
  
  const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
  const lowStockItems = state.products.filter(product => product.stock <= product.minStock);
  
  const topProducts = state.products
    .map(product => {
      const totalSold = state.sales.reduce((sum, sale) => {
        const item = sale.items.find(item => item.product.id === product.id);
        return sum + (item ? item.quantity : 0);
      }, 0);
      return { ...product, totalSold };
    })
    .sort((a, b) => b.totalSold - a.totalSold)
    .slice(0, 5);

  const stats = [
    {
      title: 'Today\'s Revenue',
      value: `L.L.${todayRevenue.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Total Sales',
      value: state.sales.length.toString(),
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Products',
      value: state.products.length.toString(),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Low Stock Items',
      value: lowStockItems.length.toString(),
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'Customers',
      value: state.customers.length.toString(),
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    },
    {
      title: 'Today\'s Orders',
      value: todaySales.length.toString(),
      icon: ShoppingCart,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
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
                  <p className="font-semibold text-gray-900">L.L.{product.price.toLocaleString()}/{product.unit}</p>
                  <p className="text-sm text-gray-600">{product.stock} in stock</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Low Stock Alert</h3>
          {lowStockItems.length > 0 ? (
            <div className="space-y-3">
              {lowStockItems.map((product) => (
                <div key={product.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-red-600">Only {product.stock} {product.unit} left</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Min: {product.minStock}</p>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                      Reorder Now
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-2 text-gray-400" />
              <p>All products are well stocked!</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Sales */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Sales</h3>
        {state.sales.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Receipt #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Customer</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Items</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Total</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Payment</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Time</th>
                </tr>
              </thead>
              <tbody>
                {state.sales.slice(0, 5).map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">{sale.receiptNumber}</td>
                    <td className="py-3 px-4">
                      {sale.customerId 
                        ? state.customers.find(c => c.id === sale.customerId)?.name || 'Unknown'
                        : 'Walk-in Customer'
                      }
                    </td>
                    <td className="py-3 px-4">{sale.items.length} items</td>
                    <td className="py-3 px-4 font-semibold">L.L.{sale.total.toLocaleString()}</td>
                    <td className="py-3 px-4">{sale.paymentMethod}</td>
                    <td className="py-3 px-4">{new Date(sale.timestamp).toLocaleTimeString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <ShoppingCart className="w-12 h-12 mx-auto mb-2 text-gray-400" />
            <p>No sales recorded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};