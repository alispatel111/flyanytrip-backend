const validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;
    
    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const coupons = {
      'FLYANYTRIP': { discount: 500, minAmount: 2000 },
      'WELCOME': { discount: 300, minAmount: 1000 },
      'GOFIRST': { discount: 1000, minAmount: 10000 },
      'OFFER10': { percentage: 10, maxDiscount: 1500, minAmount: 5000 }
    };

    const coupon = coupons[code.toUpperCase()];

    if (!coupon) {
      return res.status(404).json({ success: false, message: 'Invalid coupon code' });
    }

    if (amount < coupon.minAmount) {
      return res.status(400).json({ 
        success: false, 
        message: `Minimum amount of ₹${coupon.minAmount} required for this coupon` 
      });
    }

    let discount = 0;
    if (coupon.percentage) {
      discount = Math.min((amount * coupon.percentage) / 100, coupon.maxDiscount);
    } else {
      discount = coupon.discount;
    }

    return res.status(200).json({
      success: true,
      data: {
        code: code.toUpperCase(),
        discount: Math.round(discount),
        message: 'Coupon applied successfully!'
      }
    });
  } catch (error) {
    console.error('Coupon validation error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

module.exports = {
  validateCoupon
};
