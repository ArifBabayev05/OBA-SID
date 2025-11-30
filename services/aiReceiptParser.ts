import axios from 'axios';

// Free AI service using Hugging Face Inference API
// Alternative: You can use OpenAI API if you have a key, or other free services

interface AIParseResult {
  totalAmount: number;
  items: Array<{ name: string; price: number; category?: string }>;
  storeName: string;
  date?: string;
}

export const parseReceiptWithAI = async (receiptData: any): Promise<AIParseResult> => {
  try {
    const items: Array<{ name: string; price: number; category?: string }> = [];
    let totalAmount = 0;
    let storeName = 'Unknown Store';
    let date = new Date().toISOString();

    // Parse items from receipt data - e-kassa structure
    if (receiptData.products && Array.isArray(receiptData.products)) {
      receiptData.products.forEach((product: any) => {
        const price = parseFloat(product.price || product.amount || product.total || product.qiymət || '0');
        const quantity = parseFloat(product.quantity || product.count || product.say || '1');
        const itemTotal = price * quantity;
        
        const itemName = product.name || product.productName || product.description || product.məhsulunAdı || 'Unknown Item';
        
        items.push({
          name: itemName,
          price: itemTotal,
          category: product.category || categorizeItem(itemName),
        });
        totalAmount += itemTotal;
      });
    } else if (receiptData.items && Array.isArray(receiptData.items)) {
      receiptData.items.forEach((item: any) => {
        const price = parseFloat(item.price || item.amount || item.total || item.qiymət || '0');
        const itemName = item.name || item.productName || item.description || item.məhsulunAdı || 'Unknown Item';
        
        items.push({
          name: itemName,
          price: price,
          category: item.category || categorizeItem(itemName),
        });
        totalAmount += price;
      });
    } else if (receiptData.positions && Array.isArray(receiptData.positions)) {
      // Alternative structure
      receiptData.positions.forEach((pos: any) => {
        const price = parseFloat(pos.price || pos.amount || pos.qiymət || '0');
        const itemName = pos.name || pos.productName || pos.məhsulunAdı || 'Unknown Item';
        items.push({
          name: itemName,
          price: price,
          category: categorizeItem(itemName),
        });
        totalAmount += price;
      });
    } else {
      // Try to find data in nested structures
      if (receiptData.data) {
        return parseReceiptWithAI(receiptData.data);
      }
      
      if (receiptData.document) {
        return parseReceiptWithAI(receiptData.document);
      }
      
      if (receiptData.result) {
        return parseReceiptWithAI(receiptData.result);
      }
    }

    // Extract total amount - try multiple fields
    if (receiptData.total || receiptData.totalAmount || receiptData.sum) {
      totalAmount = parseFloat(receiptData.total || receiptData.totalAmount || receiptData.sum || '0');
    } else if (receiptData.cəmi) {
      // Azerbaijani field name
      totalAmount = parseFloat(receiptData.cəmi || '0');
    } else if (items.length > 0) {
      // Calculate from items if total not provided
      totalAmount = items.reduce((sum, item) => sum + item.price, 0);
    }

    // Extract store name - try multiple fields
    storeName = receiptData.objectName || 
                receiptData.obyektinAdı ||
                receiptData.storeName || 
                receiptData.merchantName || 
                receiptData.companyName ||
                receiptData.organizationName ||
                receiptData.taxpayerName ||
                receiptData.vergÖdəyicisininAdı ||
                receiptData.organization ||
                'Unknown Store';

    // Extract date - try multiple fields
    date = receiptData.date || 
           receiptData.transactionDate || 
           receiptData.createdAt ||
           receiptData.tarix ||
           receiptData.timestamp ||
           new Date().toISOString();

    // If date is a string, try to parse it
    if (typeof date === 'string' && date.includes('T')) {
      // Already ISO format
    } else if (typeof date === 'string') {
      // Try to parse date string
      try {
        const parsed = new Date(date);
        if (!isNaN(parsed.getTime())) {
          date = parsed.toISOString();
        }
      } catch (e) {
        // Keep original
      }
    }
    return {
      totalAmount: Math.max(totalAmount, 0),
      items: items.length > 0 ? items : [{ name: 'Receipt Total', price: totalAmount }],
      storeName,
      date,
    };
  } catch (error) {
    console.error('AI Parsing Error:', error);
    // Fallback parsing
    return {
      totalAmount: 0,
      items: [],
      storeName: 'Unknown Store',
      date: new Date().toISOString(),
    };
  }
};

// Categorize items based on name (Azerbaijani and English)
const categorizeItem = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  // Beverages
  if (lowerName.match(/coffee|latte|tea|drink|water|coke|soda|çay|qəhvə|içki|su|cola/)) {
    return 'Beverages';
  }
  
  // Grocery
  if (lowerName.match(/bread|egg|milk|cheese|meat|chicken|beef|çörək|yumurta|süd|pendir|ət|toyuq/)) {
    return 'Grocery';
  }
  
  // Fruits
  if (lowerName.match(/apple|banana|orange|fruit|peach|avocado|alma|banan|portağal|meyvə|şaftalı/)) {
    return 'Fruits';
  }
  
  // Vegetables
  if (lowerName.match(/carrot|lettuce|tomato|veg|potato|yemək|tərəvəz|kartof|pomidor|göyərti/)) {
    return 'Vegetables';
  }
  
  // Electronics
  if (lowerName.match(/usb|cable|phone|laptop|mouse|telefon|kompyuter|kabel/)) {
    return 'Electronics';
  }
  
  // Cleaning
  if (lowerName.match(/soap|clean|wash|detergent|təmizlik|sabun|yuyucu/)) {
    return 'Cleaning';
  }
  
  return 'General';
};

// Optional: Use Hugging Face for advanced parsing (if needed)
export const parseWithHuggingFace = async (text: string): Promise<any> => {
  try {
    // This is optional - Hugging Face Inference API
    // You need to register and get a free API token from https://huggingface.co/settings/tokens
    const response = await axios.post(
      'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
      { inputs: text },
      {
        headers: {
          'Authorization': `Bearer YOUR_HF_TOKEN`, // Replace with your token
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error('Hugging Face Error:', error);
    return null;
  }
};
