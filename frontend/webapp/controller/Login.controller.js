sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/m/MessageToast",
  "sap/m/MessageBox"
], function(Controller, MessageToast, MessageBox) {
  "use strict";

  return Controller.extend("migros.controller.Login", {
    onLoginPress: function () {
      const email = this.byId("emailInput").getValue();
      const password = this.byId("passwordInput").getValue();
      const role = this.byId("roleSelect").getSelectedKey();

      fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role })
      })
      .then(res => {
        if (!res.ok) throw new Error("Giriş başarısız");
        return res.json();
      })
      .then(data => {
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", role);
        MessageToast.show("Giriş başarılı");

        // Rol bazlı yönlendirme
        if (role === "store") {
          sap.ui.core.UIComponent.getRouterFor(this).navTo("StoreDashboard");
        } else {
          sap.ui.core.UIComponent.getRouterFor(this).navTo("CustomerHome");
        }
      })
      .catch(err => {
        this.byId("loginErrorText").setText("E-posta veya şifre hatalı").setVisible(true);
        console.error(err);
      });
    }
  });
});
