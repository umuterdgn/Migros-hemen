sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast"
], function(Controller, MessageToast) {
  "use strict";

  return Controller.extend("migros.controller.Register", {
    onRegisterPress: function() {
      var sName = this.byId("nameInput").getValue().trim();
      var sEmail = this.byId("emailInput").getValue().trim();
      var sPassword = this.byId("passwordInput").getValue().trim();

      if (!sName || !sEmail || !sPassword) {
        MessageToast.show("Lütfen tüm alanları doldurun.");
        return;
      }

      fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: sName, email: sEmail, password: sPassword })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          MessageToast.show("Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...");
          setTimeout(() => {
            var oRouter = this.getOwnerComponent().getRouter();
            oRouter.navTo("login");
          }, 1500);
        } else {
          MessageToast.show(data.message || "Kayıt başarısız.");
        }
      })
      .catch(err => {
        console.error(err);
        MessageToast.show("Sunucu hatası.");
      });
    },

    onNavigateLogin: function() {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("login");
    }
  });
});
