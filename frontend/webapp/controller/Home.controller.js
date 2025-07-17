sap.ui.define([
  "sap/ui/core/mvc/Controller",
  "sap/ui/model/json/JSONModel",
  "sap/m/MessageToast"
], function (Controller, JSONModel, MessageToast) {
  "use strict";

  return Controller.extend("migros.controller.Home", {
    onInit: function () {
  var oController = this;
  $.ajax({
    url: "http://localhost:8081/api/categories", // kendi sunucun
    method: "GET",
    success: function (data) {
      var oHBox = oController.byId("categoryContainer");
      oHBox.removeAllItems();

      data.forEach(function (category) {
        var oVBox = new sap.m.VBox({
          width: "120px",
          alignItems: "Center",
          justifyContent: "Center",
          items: [
            new sap.m.Button({
              icon: "sap-icon://product", // ikon
              width: "100px",
              press: function () {
                // ✅ Yönlendirme yap
                var oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
                oRouter.navTo("productRoute", {
                  categoryId: category.id,
                  categoryName: category.ad
                });
              }
            }),
            new sap.m.Text({
              text: category.ad, // ✅ Altına ismi ekle
              textAlign: "Center"
            })
          ]
        });
        oHBox.addItem(oVBox);
      });
    },
    error: function (err) {
      console.log("Kategoriler alınamadı", err);
    }
  });
}

  });
});
