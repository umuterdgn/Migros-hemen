sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/ui/core/routing/History"
], function (Controller, MessageToast, History) {
  "use strict";

  return Controller.extend("migros.controller.Login", {
    onInit: function () {},

    onLogin: async function () {
      const email = this.byId("emailInput").getValue();
      const password = this.byId("passwordInput").getValue();
      const role = this.byId("roleSelect").getSelectedKey();

      if (!email || !password || !role) {
        MessageToast.show("Lütfen tüm alanları doldurun");
        return;
      }

      try {
        const response = await fetch("http://localhost:5000/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role })
        });

        const data = await response.json();

        if (!response.ok) {
          MessageToast.show(data.msg || "Giriş başarısız");
          return;
        }

        // Token ve user verilerini sakla
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);

        // Rolüne göre yönlendirme
        const oRouter = this.getOwnerComponent().getRouter();
        if (role === "customer") {
          oRouter.navTo("customer");
        } else {
          oRouter.navTo("store");
        }

      } catch (err) {
        MessageToast.show("Sunucu hatası: " + err.message);
      }
    }
  });
});
