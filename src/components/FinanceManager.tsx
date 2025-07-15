import React, { useState } from 'react';
import { useFinance } from '../contexts/FinanceContext';
import { usePOS } from '../contexts/POSContext';
import { useSupplier } from '../contexts/SupplierContext';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  DollarSign, 
  TrendingDown, 
  Calendar,
  Receipt,
  AlertTriangle,
  CreditCard
} from 'lucide-react';

export const FinanceManager: React.FC = () => {
  const { state: financeState, dispatch: financeDispatch } = useFinance();
  const { state: posState } = usePOS();
  const { state: supplierState } = useSupplier();
  const [activeTab, setActiveTab] = useState('expenses');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    paymentMethod: 'cash',
    date: new Date().toISOString().split('T')[0],
    reference: '',
    supplierId: ''
  });

  const filteredExpenses = financeState.expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.reference?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const expenseData = {
      id: editingExpense?.id || Date.now().toString(),
      category: formData.category,
      description: formData.description,
      amount: parseFloat(formData.amount),
      paymentMethod: formData.paymentMethod,
      date: new Date(formData.date),
      reference: formData.reference,
      supplierId: formData.supplierId || undefined
    };

    if (editingExpense) {
      financeDispatch({ type: 'UPDATE_EXPENSE', payload: expenseData });
    } else {
      financeDispatch({ type: 'ADD_EXPENSE', payload: expenseData });
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      category: '',
      description: '',
      amount: '',
      paymentMethod: 'cash',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      supplierId: ''
    });
    setEditingExpense(null);
    setShowModal(false);
  };

  const handleEdit = (expense: any) => {
    setEditingExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount.toString(),
      paymentMethod: expense.paymentMethod,
      date: expense.date.toISOString().split('T')[0],
      reference: expense.reference || '',
      supplierId: expense.supplierId || ''
    });
    setShowModal(true);
  };

  const handleDelete = (expenseId: string) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      financeDispatch({ type: 'DELETE_EXPENSE', payload: expenseId });
    }
  };

  // Calculate financial metrics
  const totalExpenses = financeState.expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = posState.sales.reduce((sum, s) => sum + s.total, 0);
  const totalReceivables = posState.customers
    .filter(c => c.balance > 0)
    .reduce((sum, c) => sum + c.balance, 0);
  const totalPayables = supplierState.suppliers.reduce((sum, s) => sum + s.balance, 0);

  const monthlyExpenses = financeState.expenses.filter(e => {
    const expenseDate = new Date(e.date);
    const now = new Date();
    return expenseDate.getMonth() === now.getMonth() && 
           expenseDate.getFullYear() === now.getFullYear();
  }).reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Management</h1>
          <p className="text-gray-600">Track expenses, debts, and financial performance</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense</span>
        </button>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <TrendingDown className="w-8 h-8 text-red-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accounts Receivable</p>
              <p className="text-2xl font-bold text-blue-600">L.L.{totalReceivables.toLocaleString()}</p>
            </div>
            <Receipt className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Accounts Payable</p>
              <p className="text-2xl font-bold text-orange-600">L.L.{totalPayables.toLocaleString()}</p>
            </div>
            <CreditCard className="w-8 h-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'expenses', label: 'Expenses', icon: TrendingDown },
              { id: 'debts', label: 'Debt Management', icon: AlertTriangle },
              { id: 'cashflow', label: 'Cash Flow', icon: DollarSign }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'expenses' && (
            <>
              {/* Search */}
              <div className="flex items-center space-x-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search expenses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>

              {/* Expense Categories Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {financeState.expenseCategories.slice(0, 6).map(category => {
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
                    </div>
                  );
                })}
              </div>

              {/* Expenses Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Description</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Payment</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Reference</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">{new Date(expense.date).toLocaleDateString()}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {expense.category}
                          </span>
                        </td>
                        <td className="py-3 px-4">{expense.description}</td>
                        <td className="py-3 px-4 font-semibold text-red-600">
                          L.L.{expense.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 capitalize">{expense.paymentMethod}</td>
                        <td className="py-3 px-4">{expense.reference}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleEdit(expense)}
                              className="p-2 text-blue-600 hover:text-blue-800"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(expense.id)}
                              className="p-2 text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 'debts' && (
            <div className="space-y-6">
              {/* Customer Debts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Debts (Receivables)</h3>
                <div className="space-y-3">
                  {posState.customers.filter(c => c.balance > 0).map(customer => (
                    <div key={customer.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-600">{customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-blue-600">L.L.{customer.balance.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Outstanding</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Supplier Debts */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Supplier Debts (Payables)</h3>
                <div className="space-y-3">
                  {supplierState.suppliers.filter(s => s.balance > 0).map(supplier => (
                    <div key={supplier.id} className="flex items-center justify-between p-4 bg-orange-50 rounded-lg border border-orange-200">
                      <div>
                        <p className="font-medium text-gray-900">{supplier.name}</p>
                        <p className="text-sm text-gray-600">{supplier.paymentTerms}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-orange-600">L.L.{supplier.balance.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">Due</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cashflow' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                  <h3 className="text-lg font-semibold text-green-900 mb-4">Cash Inflows</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-green-700">Sales Revenue</span>
                      <span className="font-semibold text-green-900">L.L.{totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-green-700">Customer Payments</span>
                      <span className="font-semibold text-green-900">L.L.0</span>
                    </div>
                  </div>
                </div>

                <div className="bg-red-50 rounded-lg p-6 border border-red-200">
                  <h3 className="text-lg font-semibold text-red-900 mb-4">Cash Outflows</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-red-700">Operating Expenses</span>
                      <span className="font-semibold text-red-900">L.L.{totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-red-700">Supplier Payments</span>
                      <span className="font-semibold text-red-900">L.L.0</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Net Cash Flow</h3>
                <div className="text-center">
                  <p className={`text-3xl font-bold ${
                    totalRevenue - totalExpenses >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    L.L.{(totalRevenue - totalExpenses).toLocaleString()}
                  </p>
                  <p className="text-gray-600 mt-2">
                    {totalRevenue - totalExpenses >= 0 ? 'Positive Cash Flow' : 'Negative Cash Flow'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Expense Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">
              {editingExpense ? 'Edit Expense' : 'Add New Expense'}
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Select category</option>
                  {financeState.expenseCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  required
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData({...formData, paymentMethod: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="cash">Cash</option>
                  <option value="card">Card</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({...formData, date: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
                <input
                  type="text"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  {editingExpense ? 'Update' : 'Add'} Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};