/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"i2d/mpe/orders/manages1/controller/BaseController"
], function(BaseController) {
	"use strict";

	return BaseController.extend("i2d.mpe.orders.manages1.controller.NotFound", {

		/**
		 * Navigates to the worklist when the link is pressed
		 * @public
		 */
		onLinkPressed: function() {
			this.getRouter().navTo("worklist");
		}

	});

});