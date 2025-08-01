sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast",
  "sap/ui/thirdparty/jquery"
], function(Controller, JSONModel, MessageToast, jQuery) {
  "use strict";

  return Controller.extend("migros.controller.Checkout", {
    onInit() {
      // checkoutModel: puan kullanımını ve puan stokunu tutacak
      var oCM = new JSONModel({
        moneyPoints:       0,  // DB'den çekilecek
        usePoints:         0,  // input
        remainingPoints:   0   // hesaplanacak
      });
      this.getView().setModel(oCM, "checkoutModel");

      // Kullanıcının puanını API'den al
      var userId = 1; // gerçek uygulamada oturum açanın ID'si
      jQuery.ajax({
        url:    `http://localhost:8081/api/users/${userId}`,
        method: "GET",
        success: (res) => {
          if (res.success) {
            oCM.setProperty("/moneyPoints", res.money_points);
            oCM.setProperty("/remainingPoints", res.money_points);
          }
        },
        error: () => {
          MessageToast.show("Puan bilgisi yüklenemedi.");
        }
      });
    },

    onMoneyPointsChange(oEvt) {
      var oCM   = this.getView().getModel("checkoutModel");
      var val   = parseInt(oEvt.getParameter("value"), 10) || 0;
      var max   = oCM.getProperty("/moneyPoints");

      // sınırla: negatif olmasın, mevcut puanı aşmasın
      if (val < 0) val = 0;
      if (val > max) val = max;

      oCM.setProperty("/usePoints", val);
      oCM.setProperty("/remainingPoints", max - val);
    },

    onUseMoneyPoints() {
      var oCart   = this.getOwnerComponent().getModel("cartModel");
      var summary = oCart.getProperty("/summary");
      var oCM     = this.getView().getModel("checkoutModel");
      var used    = oCM.getProperty("/usePoints");

      // toplamdan düş
      var newTotal = parseFloat(summary.total) - used;
      if (newTotal < 0) newTotal = 0;

      // özet modeli güncelle
      oCart.setProperty("/summary/total", newTotal.toFixed(2));
      MessageToast.show(used + " ₺ para puan uygulandı.");
    },

    onPlaceOrder() {
      var oCartModel  = this.getOwnerComponent().getModel("cartModel");
      var aItems      = oCartModel.getProperty("/cartItems");
      var summary     = oCartModel.getProperty("/summary");
      var oCM         = this.getView().getModel("checkoutModel");
      var userId      = 1;

      // yüklenen puanı de payload’a ekle
      var payload = {
        userId, 
        totalAmount: parseFloat(summary.total),
        useMoneyPoints: oCM.getProperty("/usePoints"),
        items: aItems.map(i => ({
          productId: i.id,
          quantity:  i.quantity,
          price:     i.price
        }))
      };

      jQuery.ajax({
        url:    "http://localhost:8081/api/orders",
        method: "POST",
        contentType: "application/json",
        data:  JSON.stringify(payload),
        success: (res) => {
          if (res.success) {
            MessageToast.show("Sipariş alındı! ID: " + res.orderId);
            // temizle
            oCartModel.setProperty("/cartItems", []);
            oCartModel.setProperty("/summary", {
              totalItems:     0,
              subtotal:       "0.00",
              discount:       "0.00",
              deliveryText:   "",
              total:          "0.00"
            });
            oCM.setProperty("/usePoints",       0);
            oCM.setProperty("/remainingPoints", oCM.getProperty("/moneyPoints"));
            this.getOwnerComponent().getRouter().navTo("home");
          } else {
            MessageToast.show("Sipariş başarısız: " + res.message);
          }
        },
        error: () => {
          MessageToast.show("Sunucu hatası, tekrar deneyin.");
        }
      });
    }
  });
});
