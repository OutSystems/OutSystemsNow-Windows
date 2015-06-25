(function (WinJS) {
    WinJS.Namespace.define("OutSystemsNow.UI", {
        Autocomplete: WinJS.Class.define(function (element, options) {
            if (!element || element.tagName.toLowerCase() !== "input") throw "input type must be provided";
            options = options || {};
            this._setElement(element);
            this._setOptionList(options.optionList);
            this._element.winControl = this;
            WinJS.UI.setOptions(this, options);
            this._createDataList();
        },
            {
                //Private members
                _element: null,
                _optionList: null,
                _setElement: function (element) {
                    this._element = element;
                },
                _setOptionList: function (optionList) {
                    optionList = optionList || [];
                    this._optionList = optionList;
                },
                _createDataList: function () {
                    var i = 0,
                        len = this._optionList.length,
                        dl = document.createElement('datalist');
                    dl.id = 'dl' + this._element.id;
                    this._element.setAttribute("list", dl.id);
                    for (; i < len; i += 1) {
                        var option = document.createElement('option');
                        option.value = this._optionList[i];
                        dl.appendChild(option);
                    }
                    document.body.appendChild(dl);
                },

                //Public members
                element: {
                    get: function () {
                        return this._element;
                    }
                }
            })
    });
}(WinJS));