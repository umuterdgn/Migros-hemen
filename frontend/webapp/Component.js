sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
  "use strict";

  return UIComponent.extend("migros.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      // 1) Üst sınıf init’i bir kez çağrılıyor
      UIComponent.prototype.init.apply(this, arguments);

      // 2) Tema ve stil (istiyorsan)
      sap.ui.getCore().applyTheme("sap_fiori_3");
      sap.ui.require(["sap/ui/dom/includeStylesheet"], function (includeStylesheet) {
        includeStylesheet("css/style.css");
      });

      // 3) Global cart Model — badge ve buton için gerekli tüm property’ler
      var oCartModel = new JSONModel({
        cartItems: [],
        summary: {
          totalItems: 0,
          subtotal: "0.00",
          discount: "0.00",
          total: "0.00"
        },
        // Sepetim butonunun başlangıç ayarları
        buttonType: "Emphasized",
        buttonIcon: "sap-icon://cart",
        buttonText: "Sepetim",
        badgeStyle: "Information"
      });
      this.setModel(oCartModel, "cartModel");

      // 4) Router başlat (bir kez)
      this.getRouter().initialize();
    },

    createContent: function () {
      return sap.ui.view({
        viewName: "migros.view.App",
        type: "XML",
        id: "app"
      });
    }
  });
});
