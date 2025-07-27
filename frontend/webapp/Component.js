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

      // 3) Global cartModel
      var oCartModel = new JSONModel({
        cartItems: [],
        summary: {}
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
