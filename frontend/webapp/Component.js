sap.ui.define([
  "sap/ui/core/UIComponent",
  "sap/ui/model/json/JSONModel",
  "sap/ui/core/routing/History"
], function (UIComponent, JSONModel, History) {
  "use strict";

  return UIComponent.extend("migros.Component", {
    metadata: {
      manifest: "json"
    },

    init: function () {
      // call the base component's init function
      UIComponent.prototype.init.apply(this, arguments);

      // initialize the router
      this.getRouter().initialize();
    }
  });
});
