sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/model/json/JSONModel"
], function(Controller, MessageToast, JSONModel) {
  "use strict";

  return Controller.extend("migros.view.Login", {

// _mockUsers: {
//       "admin@example.com": {
//         password: "admin123",
//         name: "Admin User",
//         role: "admin"
//       },
//       "user@example.com": {
//         password: "user123",
//         name: "Regular User",
//         role: "user"
//       }
//     },

    onInit: function () {
      // Kullanıcı modelini sıfırla
      this.getOwnerComponent().setModel(new JSONModel(), "user");
    },

    onLoginPress: function() {
      var sEmail = this.byId("emailInput").getValue().trim();
      var sPassword = this.byId("passwordInput").getValue().trim();

      if (!sEmail || !sPassword) {
        MessageToast.show("Lütfen e-posta ve şifre girin.");
        return;
      }

      fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ email: sEmail, password: sPassword })
      })
      .then(response => response.json())
      .then(data => this._handleLoginResponse(data))
      .catch(err => this._handleLoginError(err));
    },

    _handleLoginResponse: function(data) {
      if (data.success && data.token && data.user) {
        // JWT token'ı localStorage'a kaydet
        localStorage.setItem("jwtToken", data.token);

        // Kullanıcı modelini sap.ui.model.json.JSONModel ile ayarla
        var oUserModel = new JSONModel({
          name: data.user.name,
          role: data.user.role,
          email: data.user.email
        });
        this.getOwnerComponent().setModel(oUserModel, "user");

        MessageToast.show("Giriş başarılı!");
        this._navigateToHomePage();
      } else {
        MessageToast.show(data.message || "Giriş başarısız.");
      }
    },

    _handleLoginError: function(err) {
      MessageToast.show("Sunucu hatası. Daha sonra tekrar deneyin.");
      console.error(err);
    },

    _navigateToHomePage: function() {
      var oRouter = this.getOwnerComponent().getRouter();
      oRouter.navTo("home");
    },

    onForgotPassword: function() {
      MessageToast.show("Şifre yenileme özelliği henüz aktif değil.");
    },

    onSignup: function() {
    var oRouter = this.getOwnerComponent().getRouter();
    oRouter.navTo("register");
    }
  });
});
