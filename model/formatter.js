/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define(["sap/ui/model/odata/type/Time","sap/ui/core/format/DateFormat","sap/ui/model/Filter"],function(T,D,F){"use strict";return{numberUnit:function(v){if(!v){return"";}return parseFloat(v).toFixed(2);},setHoldIconVisibility:function(M){if(M==="X"||M===true){return true;}else{return false;}},setObjectPageLayoutReference:function(o){this.oObjectPageLayoutinstance=o;},getObjectPageLayoutReference:function(){return this.oObjectPageLayoutinstance;},finalConfirmation:function(f){if(f==="X"){return this.getI18NCommonText("Yes");}else{return this.getI18NCommonText("No");}},setEnableStatus:function(s){if(s==="03"||s==="05"){return true;}else{return false;}},setEnableStatusRelease:function(s){if(s==="01"||s==="02"){return true;}else{return false;}},setEnableRereadMD:function(o,O){if((o===""&&O==="01")||(o==="X"&&(O==="01"||O==="02"||O==="03"))){return true;}else{return false;}},setEnableHoldButton:function(o,s){if(o==="X"){if(s==="06"||s==="08"||s==="09"||s==="10"||s==="11"||s==="12"){return false;}else{return true;}}else{return false;}},getButtonStatus:function(p){if(p.OrderIsClosed!=="X"&&p.OrderIsConfirmed!=="X"&&p.OrderIsDeleted!=="X"&&p.OrderIsDelivered!=="X"&&p.OrderIsLocked!=="X"&&p.OrderIsTechnicallyCompleted!=="X"){return true;}else{return false;}},getFeatureAvailability:function(M){if(M==="X"||M===true){return true;}else{return false;}},setEnableConfigButton:function(p){if(p!=="000000000000000000"){return true;}else{return false;}},setDateFormat:function(d){var o=sap.ui.core.format.DateFormat.getDateTimeInstance({pattern:"yyyy-MM-dd"});return o.format(new Date(d));},formatSerialNumbers:function(N,S){if(N>1){return this.getView().getModel("i18n").getResourceBundle().getText("multipleSFIs",[S,N-1]);}else if(N===0){return"";}else{return S;}},setMaterialFormat:function(M,a){return this.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersMaterialCell",[M,a]);},setTotalQuantityFormat:function(M,P){return this.getView().getModel("i18n").getResourceBundle().getText("relatedOrdersTotalQuantity",[M,P]);}};});