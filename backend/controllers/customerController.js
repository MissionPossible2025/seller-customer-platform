import Customer from '../models/customerModel.js';
import jwt from 'jsonwebtoken';

// Get customer by ID
const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await Customer.findById(id);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json({ customer });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
};

// Get all customers for a seller
const getCustomersBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const customers = await Customer.find({ sellerId, isActive: true })
      .sort({ createdAt: -1 });
    
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
};

// Add a new customer
const addCustomer = async (req, res) => {
  try {
    const { name, phone, sellerId } = req.body;

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({ phone, sellerId });
    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this phone number already exists' });
    }

    const customer = new Customer({
      name,
      phone,
      sellerId
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    console.error('Error adding customer:', error);
    if (error.code === 11000) {
      res.status(400).json({ error: 'Customer with this phone number already exists' });
    } else {
      res.status(500).json({ error: 'Failed to add customer' });
    }
  }
};

// Update customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;

    console.log('Update customer request:', { id, name, phone, email, address });

    // Find the customer first
    const customer = await Customer.findById(id);
    if (!customer) {
      console.error('Customer not found with ID:', id);
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Initialize address if it doesn't exist
    if (!customer.address) {
      customer.address = {
        street: '',
        city: '',
        state: '',
        pincode: '',
        country: 'India'
      };
    }

    // Update fields if provided
    if (name !== undefined && name !== null) customer.name = name.trim();
    if (phone !== undefined && phone !== null) customer.phone = phone.trim();
    if (email !== undefined) customer.email = email ? email.trim().toLowerCase() : '';
    if (address) {
      customer.address = {
        street: (address.street && address.street.trim()) || customer.address.street || '',
        city: (address.city && address.city.trim()) || customer.address.city || '',
        state: (address.state && address.state.trim()) || customer.address.state || '',
        pincode: (address.pincode && address.pincode.trim()) || customer.address.pincode || '',
        country: (address.country && address.country.trim()) || customer.address.country || 'India'
      };
    }

    // Check if profile is complete
    const isProfileComplete = Boolean(
      customer.name && customer.name.trim() &&
      customer.phone && customer.phone.trim() &&
      customer.address && 
      customer.address.street && customer.address.street.trim() &&
      customer.address.city && customer.address.city.trim() &&
      customer.address.state && customer.address.state.trim() &&
      customer.address.pincode && customer.address.pincode.trim()
    );
    
    customer.profileComplete = isProfileComplete;

    await customer.save();
    console.log('Customer updated successfully:', customer._id);
    res.json({ message: "Profile updated successfully", customer });
  } catch (error) {
    console.error('Error updating customer:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      name: error.name,
      stack: error.stack
    });
    if (error.code === 11000) {
      res.status(400).json({ error: 'Customer with this phone number already exists' });
    } else {
      res.status(500).json({ 
        error: 'Failed to update customer',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Delete customer (soft delete)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await Customer.findByIdAndUpdate(
      id,
      { isActive: false, updatedAt: Date.now() },
      { new: true }
    );

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ message: 'Customer removed successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
};

// Check if phone number is permitted
const checkPhoneNumber = async (req, res) => {
  try {
    const { phone } = req.body;

    const customer = await Customer.findOne({ phone, isActive: true });
    if (!customer) {
      return res.status(404).json({ error: 'Phone number not registered. Please contact the store owner to get access.' });
    }

    res.json({ 
      message: 'Phone number is registered',
      customer: {
        name: customer.name,
        phone: customer.phone
      }
    });
  } catch (error) {
    console.error('Error checking phone number:', error);
    res.status(500).json({ error: 'Failed to check phone number' });
  }
};

// Customer signup
const customerSignup = async (req, res) => {
  try {
    const { name, phone } = req.body;

    // Check if phone number is permitted
    const permittedCustomer = await Customer.findOne({ phone, isActive: true });
    if (!permittedCustomer) {
      return res.status(404).json({ error: 'Phone number not registered. Please contact the store owner to get access.' });
    }

    // Check if customer already has an account
    const existingCustomer = await Customer.findOne({ phone, isActive: true });
    if (existingCustomer && existingCustomer.name !== name) {
      // Update the name if it's different
      existingCustomer.name = name;
      existingCustomer.lastLogin = Date.now();
      await existingCustomer.save();
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: permittedCustomer._id,
        phone: permittedCustomer.phone,
        name: permittedCustomer.name,
        sellerId: permittedCustomer.sellerId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' } // 3 months
    );

    res.json({
      message: 'Account created successfully',
      token,
      customer: {
        _id: permittedCustomer._id,
        name: permittedCustomer.name,
        phone: permittedCustomer.phone,
        email: permittedCustomer.email || '',
        sellerId: permittedCustomer.sellerId,
        address: permittedCustomer.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        profileComplete: !!permittedCustomer.profileComplete
      }
    });
  } catch (error) {
    console.error('Error in customer signup:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

// Customer login
const customerLogin = async (req, res) => {
  try {
    const { phone, name } = req.body;

    // Check if phone number is permitted
    const customer = await Customer.findOne({ phone, isActive: true });
    if (!customer) {
      return res.status(404).json({ error: 'Phone number not registered. Please contact the store owner to get access.' });
    }

    // Update last login
    customer.lastLogin = Date.now();
    await customer.save();

    // Generate JWT token
    const token = jwt.sign(
      { 
        customerId: customer._id,
        phone: customer.phone,
        name: customer.name,
        sellerId: customer.sellerId
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '90d' } // 3 months
    );

    res.json({
      message: 'Login successful',
      token,
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        sellerId: customer.sellerId,
        address: customer.address || {
          street: '',
          city: '',
          state: '',
          pincode: '',
          country: 'India'
        },
        profileComplete: !!customer.profileComplete
      }
    });
  } catch (error) {
    console.error('Error in customer login:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

export {
  getCustomerById,
  getCustomersBySeller,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  checkPhoneNumber,
  customerSignup,
  customerLogin
};
