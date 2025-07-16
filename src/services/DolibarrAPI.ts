interface DolibarrConfig {
  baseUrl: string;
  apiKey: string;
  username?: string;
  password?: string;
}

interface DolibarrProduct {
  id: number;
  ref: string;
  label: string;
  description?: string;
  price: number;
  price_ttc: number;
  stock_reel: number;
  seuil_stock_alerte: number;
  barcode?: string;
  fk_product_type: number;
  weight?: number;
  weight_units?: number;
  entity: number;
}

interface DolibarrCustomer {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_code?: string;
  client: number;
  fournisseur: number;
  code_client?: string;
  outstanding_limit?: number;
}

interface DolibarrSupplier {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  zip?: string;
  town?: string;
  country_code?: string;
  fournisseur: number;
  code_fournisseur?: string;
  outstanding_limit?: number;
}

interface DolibarrInvoice {
  id?: number;
  ref?: string;
  socid: number;
  date: number;
  type: number;
  lines: DolibarrInvoiceLine[];
  note_public?: string;
  note_private?: string;
  mode_reglement_id?: number;
  cond_reglement_id?: number;
}

interface DolibarrInvoiceLine {
  fk_product?: number;
  product_ref?: string;
  product_label?: string;
  desc?: string;
  qty: number;
  subprice: number;
  total_ht: number;
  total_ttc: number;
  tva_tx: number;
}

class DolibarrAPIService {
  private config: DolibarrConfig;
  private isDemo: boolean = true; // Set to false for real API calls

  constructor(config: DolibarrConfig) {
    this.config = config;
  }

  private async makeRequest(endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', data?: any) {
    if (this.isDemo) {
      return this.getDemoResponse(endpoint, method, data);
    }

    const url = `${this.config.baseUrl}/api/index.php/${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    // Add authentication
    if (this.config.apiKey) {
      headers['DOLAPIKEY'] = this.config.apiKey;
    } else if (this.config.username && this.config.password) {
      headers['Authorization'] = `Basic ${btoa(`${this.config.username}:${this.config.password}`)}`;
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });

      if (!response.ok) {
        throw new Error(`Dolibarr API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Dolibarr API Request Failed:', error);
      throw error;
    }
  }

  private getDemoResponse(endpoint: string, method: string, data?: any) {
    // Simulate API responses for demo purposes
    console.log(`Demo Dolibarr API Call: ${method} ${endpoint}`, data);
    
    if (endpoint.includes('products')) {
      return Promise.resolve([
        {
          id: 1,
          ref: 'TOMATO001',
          label: 'Fresh Tomatoes',
          price: 67500,
          price_ttc: 79650,
          stock_reel: 150,
          seuil_stock_alerte: 20,
          barcode: '1234567890123',
          fk_product_type: 0
        },
        {
          id: 2,
          ref: 'POTATO001',
          label: 'Premium Potatoes',
          price: 45000,
          price_ttc: 53100,
          stock_reel: 200,
          seuil_stock_alerte: 30,
          barcode: '2345678901234',
          fk_product_type: 0
        }
      ]);
    }

    if (endpoint.includes('thirdparties')) {
      return Promise.resolve([
        {
          id: 1,
          name: 'Green Grocers Ltd',
          email: 'orders@greengrocers.com',
          phone: '+1234567890',
          client: 1,
          fournisseur: 0,
          outstanding_limit: 50000
        }
      ]);
    }

    if (endpoint.includes('invoices') && method === 'POST') {
      return Promise.resolve({
        id: Date.now(),
        ref: `INV${Date.now().toString().slice(-6)}`,
        ...data
      });
    }

    return Promise.resolve({ success: true, message: 'Demo response' });
  }

  // Product Management
  async getProducts(): Promise<DolibarrProduct[]> {
    return this.makeRequest('products');
  }

  async getProduct(id: number): Promise<DolibarrProduct> {
    return this.makeRequest(`products/${id}`);
  }

  async updateProductStock(id: number, stock: number): Promise<any> {
    return this.makeRequest(`products/${id}`, 'PUT', { stock_reel: stock });
  }

  async createProduct(product: Partial<DolibarrProduct>): Promise<DolibarrProduct> {
    return this.makeRequest('products', 'POST', product);
  }

  // Customer Management
  async getCustomers(): Promise<DolibarrCustomer[]> {
    return this.makeRequest('thirdparties?mode=customer');
  }

  async getCustomer(id: number): Promise<DolibarrCustomer> {
    return this.makeRequest(`thirdparties/${id}`);
  }

  async createCustomer(customer: Partial<DolibarrCustomer>): Promise<DolibarrCustomer> {
    return this.makeRequest('thirdparties', 'POST', { ...customer, client: 1 });
  }

  async updateCustomer(id: number, customer: Partial<DolibarrCustomer>): Promise<DolibarrCustomer> {
    return this.makeRequest(`thirdparties/${id}`, 'PUT', customer);
  }

  // Supplier Management
  async getSuppliers(): Promise<DolibarrSupplier[]> {
    return this.makeRequest('thirdparties?mode=supplier');
  }

  async getSupplier(id: number): Promise<DolibarrSupplier> {
    return this.makeRequest(`thirdparties/${id}`);
  }

  async createSupplier(supplier: Partial<DolibarrSupplier>): Promise<DolibarrSupplier> {
    return this.makeRequest('thirdparties', 'POST', { ...supplier, fournisseur: 1 });
  }

  // Invoice Management
  async createInvoice(invoice: DolibarrInvoice): Promise<DolibarrInvoice> {
    return this.makeRequest('invoices', 'POST', invoice);
  }

  async getInvoices(customerId?: number): Promise<DolibarrInvoice[]> {
    const endpoint = customerId ? `invoices?thirdparty_ids=${customerId}` : 'invoices';
    return this.makeRequest(endpoint);
  }

  async validateInvoice(id: number): Promise<any> {
    return this.makeRequest(`invoices/${id}/validate`, 'POST');
  }

  // Stock Management
  async getStockMovements(productId?: number): Promise<any[]> {
    const endpoint = productId ? `stockmovements?product_id=${productId}` : 'stockmovements';
    return this.makeRequest(endpoint);
  }

  async createStockMovement(movement: any): Promise<any> {
    return this.makeRequest('stockmovements', 'POST', movement);
  }

  // Purchase Orders
  async createPurchaseOrder(order: any): Promise<any> {
    return this.makeRequest('supplierorders', 'POST', order);
  }

  async getPurchaseOrders(supplierId?: number): Promise<any[]> {
    const endpoint = supplierId ? `supplierorders?thirdparty_ids=${supplierId}` : 'supplierorders';
    return this.makeRequest(endpoint);
  }

  // Payments
  async createPayment(payment: any): Promise<any> {
    return this.makeRequest('payments', 'POST', payment);
  }

  async getPayments(invoiceId?: number): Promise<any[]> {
    const endpoint = invoiceId ? `payments?invoice_id=${invoiceId}` : 'payments';
    return this.makeRequest(endpoint);
  }

  // Sync Methods
  async syncProducts(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const dolibarrProducts = await this.getProducts();
      const errors: any[] = [];
      let synced = 0;

      // This would integrate with your POS context to sync products
      console.log('Syncing products from Dolibarr:', dolibarrProducts.length);
      
      // Transform Dolibarr products to POS format
      const posProducts = dolibarrProducts.map(product => ({
        id: product.id.toString(),
        name: product.label,
        category: 'Vegetables', // You might want to map this from Dolibarr categories
        price: product.price,
        unit: 'kg', // Map from Dolibarr weight_units
        stock: product.stock_reel,
        minStock: product.seuil_stock_alerte,
        barcode: product.barcode,
        supplier: 'Dolibarr Sync'
      }));

      synced = posProducts.length;

      return { success: true, synced, errors };
    } catch (error) {
      return { success: false, synced: 0, errors: [error] };
    }
  }

  async syncCustomers(): Promise<{ success: boolean; synced: number; errors: any[] }> {
    try {
      const dolibarrCustomers = await this.getCustomers();
      const errors: any[] = [];
      let synced = 0;

      console.log('Syncing customers from Dolibarr:', dolibarrCustomers.length);

      // Transform Dolibarr customers to POS format
      const posCustomers = dolibarrCustomers.map(customer => ({
        id: customer.id.toString(),
        name: customer.name,
        phone: customer.phone || '',
        email: customer.email || '',
        address: `${customer.address || ''} ${customer.zip || ''} ${customer.town || ''}`.trim(),
        type: 'wholesale' as const,
        creditLimit: customer.outstanding_limit || 0,
        balance: 0 // This would need to be calculated from outstanding invoices
      }));

      synced = posCustomers.length;

      return { success: true, synced, errors };
    } catch (error) {
      return { success: false, synced: 0, errors: [error] };
    }
  }

  async syncSale(sale: any): Promise<{ success: boolean; invoiceId?: number; error?: string }> {
    try {
      // Create invoice in Dolibarr
      const invoice: DolibarrInvoice = {
        socid: sale.customerId ? parseInt(sale.customerId) : 1, // Default customer if walk-in
        date: Math.floor(new Date(sale.timestamp).getTime() / 1000),
        type: 0, // Standard invoice
        lines: sale.items.map((item: any) => ({
          fk_product: parseInt(item.product.id),
          product_ref: item.product.barcode,
          product_label: item.product.name,
          qty: item.quantity,
          subprice: item.product.price,
          total_ht: item.subtotal,
          total_ttc: item.subtotal * 1.18, // Assuming 18% tax
          tva_tx: 18
        })),
        note_private: `POS Sale - Receipt: ${sale.receiptNumber}`,
        mode_reglement_id: this.getPaymentModeId(sale.paymentMethod)
      };

      const createdInvoice = await this.createInvoice(invoice);
      
      // Validate the invoice
      if (createdInvoice.id) {
        await this.validateInvoice(createdInvoice.id);
      }

      // Update stock levels
      for (const item of sale.items) {
        const currentProduct = await this.getProduct(parseInt(item.product.id));
        const newStock = currentProduct.stock_reel - item.quantity;
        await this.updateProductStock(parseInt(item.product.id), newStock);
      }

      return { success: true, invoiceId: createdInvoice.id };
    } catch (error) {
      console.error('Failed to sync sale to Dolibarr:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  private getPaymentModeId(paymentMethod: string): number {
    // Map POS payment methods to Dolibarr payment mode IDs
    const paymentModes: Record<string, number> = {
      'cash': 1,
      'card': 2,
      'upi': 3,
      'credit': 4,
      'bank_transfer': 5
    };
    return paymentModes[paymentMethod] || 1;
  }

  // Health check
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.makeRequest('status');
      return { success: true, message: 'Connection successful' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }
}

export { DolibarrAPIService, type DolibarrConfig, type DolibarrProduct, type DolibarrCustomer, type DolibarrSupplier };

export { DolibarrAPIService }