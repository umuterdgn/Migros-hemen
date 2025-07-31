sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/ui/thirdparty/jquery"      // ← jQuery’yi buradan import ediyoruz
], function(Controller, JSONModel, MessageToast, jQuery) {
  "use strict";

  return Controller.extend("migros.controller.Checkout", {
    onInit() {
      const oModel = new JSONModel({
        checkout: { deliveryOption: "cargo", paymentMethod: "card", useMoney: 0 },
        deliveryOptions: [
          { key: "cargo", text: "Kargo (Ücretsiz)" },
          { key: "store", text: "Mağazadan Teslim" },
          { key: "door",  text: "Kapıda Ödeme" }
        ],
        paymentMethods: [
          { key: "card",   text: "Kredi Kartı" },
          { key: "paypal", text: "PayPal" },
          { key: "cash",   text: "Kapıda Nakit" }
        ],
        user: { money: 100 }
      });
      this.getView().setModel(oModel, "checkoutModel");
    },

    onUseMoneyChange(oEvt) {
      this.getView()
        .getModel("checkoutModel")
        .setProperty("/checkout/useMoney", oEvt.getParameter("value"));
    },

    onPlaceOrder() {
      const oCM   = this.getView().getModel("checkoutModel").getProperty("/checkout");
      const aCart = this.getOwnerComponent().getModel("cartModel").getProperty("/cartItems");
      const userId = 1; // gerçek userId’nizi alın

      const payload = {
        userId,
        deliveryOption: oCM.deliveryOption,
        paymentMethod:  oCM.paymentMethod,
        useMoney:       oCM.useMoney,
        items: aCart.map(i => ({
          productId: i.id,
          quantity:  i.quantity,
          price:     i.price
        }))
      };

      jQuery.ajax({
        url:         "http://localhost:8081/api/checkout",
        method:      "POST",
        contentType: "application/json",
        data:        JSON.stringify(payload),
        success: (data) => {
          if (data.success) {
            MessageToast.show("Siparişiniz alındı! Numara: " + data.orderId);
            // sepeti temizle
            const oCartModel = this.getOwnerComponent().getModel("cartModel");
            oCartModel.setProperty("/cartItems", []);
            oCartModel.setProperty("/summary", {
              subtotal:     "0.00",
              discount:     "0.00",
              deliveryText: "",
              total:        "0.00"
            });
            this.getOwnerComponent().getRouter().navTo("home");
          } else {
            MessageToast.show("Sipariş oluşturulamadı: " + data.message);
          }
        },
        error: () => {
          MessageToast.show("Sunucu hatası!");
        }
      });
    }
  });
});
