sap.ui.define(["sap/ui/core/mvc/Controller"], function (Controller) {
  return Controller.extend("migros.controller.Cart", {
    onInit: function () {
      this.getView().addEventDelegate({ onBeforeShow: this._onBeforeShow.bind(this) });
    },
    _onBeforeShow: function () {
      var oCartModel = this.getOwnerComponent().getModel("cartModel");
      this._updateSummary(oCartModel);
    },


onQuantityChange: function(oEvt) {
  var iNewQty = oEvt.getParameter("value");
  var oCtx = oEvt.getSource().getBindingContext("cartModel"); // ✅ DÜZELTİLDİ

  if (!oCtx) {
    console.error("Binding context bulunamadı!");
    return;
  }

  var sPath = oCtx.getPath(); // örn: "/cartItems/0"
  var oModel = this.getView().getModel("cartModel"); // ✅ DÜZELTİLDİ
  var oData = oModel.getProperty(sPath);

  oData.quantity = iNewQty;
  oModel.setProperty(sPath + "/quantity", iNewQty);
  
  oModel.refresh(); // opsiyonel
}
,
      // Sepet öğesini sil
    onDeleteItem: function (oEvt) {
      var sId = oEvt.getSource().getCustomData()[0].getValue();
      var oModel = this.getOwnerComponent().getModel("cartModel");
      var aItems = oModel.getProperty("/cartItems") || [];
      aItems = aItems.filter(function (i) { return i.id != sId; });
      oModel.setProperty("/cartItems", aItems);
      this._updateSummary(oModel);
    },
    _updateSummary: function (oModel) {
      var aItems = oModel.getProperty("/cartItems") || [];
      var subtotal = 0, discount = 0;
      aItems.forEach(function (i) { subtotal += i.price * i.quantity; if (i.oldPrice) discount += (i.oldPrice - i.price) * i.quantity; });
      var deliveryText = subtotal >= 200 ? "Ücretsiz" : (200 - subtotal).toFixed(2) + " ₺ eksik";
      var total = (subtotal - discount).toFixed(2);
      oModel.setProperty("/summary", { subtotal: subtotal.toFixed(2), discount: discount.toFixed(2), deliveryText: deliveryText, total: total });
    },
    onCheckout: function () { this.getOwnerComponent().getRouter().navTo("checkoutRoute"); }
  });
});
