const mongoose = require('mongoose');

const Quote = mongoose.model('Quote');
const Invoice = mongoose.model('Invoice');

const { increaseBySettingKey } = require('@/middlewares/settings');

const convert = async (req, res) => {
  const quote = await Quote.findOne({
    _id: req.params.id,
    removed: false,
  }).exec();

  if (!quote) {
    return res.status(404).json({
      success: false,
      result: null,
      message: 'Quote not found',
    });
  }

  if (quote.convertedToInvoice) {
    const existingInvoice = await Invoice.findOne({
      _id: quote.convertedToInvoice,
      removed: false,
    }).exec();

    return res.status(200).json({
      success: true,
      result: existingInvoice,
      message: 'Quote already converted to invoice',
    });
  }

  const createdInvoice = await new Invoice({
    createdBy: req.admin._id,
    number: quote.number,
    year: quote.year,
    date: quote.date,
    expiredDate: quote.expiredDate,
    client: quote.client,
    converted: {
      from: 'quote',
      quote: quote._id,
    },
    items: quote.items,
    taxRate: quote.taxRate,
    subTotal: quote.subTotal,
    taxTotal: quote.taxTotal,
    total: quote.total,
    currency: quote.currency,
    credit: 0,
    discount: 0,
    notes: quote.notes,
    status: 'draft',
    paymentStatus: 'unpaid',
    pdf: '',
  }).save();

  const updatedInvoice = await Invoice.findOneAndUpdate(
    { _id: createdInvoice._id },
    { pdf: `invoice-${createdInvoice._id}.pdf` },
    { new: true }
  ).exec();

  await Quote.findOneAndUpdate(
    { _id: quote._id },
    {
      convertedToInvoice: createdInvoice._id,
      status: quote.status === 'accepted' ? quote.status : 'accepted',
    },
    { new: true }
  ).exec();

  increaseBySettingKey({
    settingKey: 'last_invoice_number',
  });

  return res.status(200).json({
    success: true,
    result: updatedInvoice,
    message: 'Quote converted to invoice successfully',
  });
};

module.exports = convert;
