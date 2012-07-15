// Inspired by base2 and Prototype
(function(){
  var initializing = false, fnTest = /xyz/.test(function(){xyz;}) ? /\b_super\b/ : /.*/;

  // The base Class implementation (does nothing)
  this.Class = function(){};

  // Create a new Class that inherits from this class
  Class.extend = function(prop) {
    var _super = this.prototype;

    // Instantiate a base class (but only create the instance,
    // don't run the init constructor)
    initializing = true;
    var prototype = new this();
    initializing = false;

    // Copy the properties over onto the new prototype
    for (var name in prop) {
      // Check if we're overwriting an existing function
      prototype[name] = typeof prop[name] == "function" &&
        typeof _super[name] == "function" && fnTest.test(prop[name]) ?
        (function(name, fn){
          return function() {
            var tmp = this._super;

            // Add a new ._super() method that is the same method
            // but on the super-class
            this._super = _super[name];

            // The method only need to be bound temporarily, so we
            // remove it when we're done executing
            var ret = fn.apply(this, arguments);       
            this._super = tmp;

            return ret;
          };
        })(name, prop[name]) :
        prop[name];
    }

    // The dummy class constructor
    function Class() {
      // All construction is actually done in the init method
      if ( !initializing && this.init )
        this.init.apply(this, arguments);
    }

    // Populate our constructed prototype object
    Class.prototype = prototype;

    // Enforce the constructor to be what we expect
    Class.constructor = Class;

    // And make this class extendable
    Class.extend = arguments.callee;

    return Class;
  };
})();

var Collage = Class.extend({
    DEFAULT_TARGET_HEIGHT: 250,
    DEFAULT_BORDER_WIDTH: 1,
    
    init: function(params) {
        this._photos = params.photos;
        this._renderTargetId = params.renderTargetId;        
        this._containerWidth = params.width || $('#' + this._renderTargetId).width();
        this._clipSize = (params.borderWidth || this.DEFAULT_BORDER_WIDTH) * 2;
        this._targetHeight = (params.targetRowHeight || this.DEFAULT_TARGET_HEIGHT);
        
        var timeoutId;
        var self = this;
        $(window).resize(function() {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(self.doneResizing, 500);
        });        
    },
    doneResizing: function(){
      this.render();
      // console.log('done')
    },
    
    render: function() {
        var rowData = this.setupRows();
        this.renderRows(rowData.rows, rowData.rowWidths);
    },
    
    getImageWidth: function(photo) {
        return photo.width;
    },
    
    getImageHeight: function(photo) {
        return photo.height;
    },
    
    getScaledWidth: function(photo) {
        var imgWidth = this.getImageWidth(photo);
        var imgHeight = this.getImageHeight(photo);
        return imgWidth * this._targetHeight / imgHeight;
    },
    
    // returns rows which is array of arrays
    setupRows: function() {
        // have a target height
        // iterate through each photo
        var rows = [];   
        var rowWidths = [];     
        var row = [];
        var tempWidth = 0;
        var rowCount = 0;
        rows[rowCount] = new Array();
        for (var i = 0; i < this._photos.length; i++) {
            var photo = this._photos[i];            
            // keep track of a 'row' by summing the scaled widths until we cross the max width
            // calculate scaled width given target height
            var scaledWidth = this.getScaledWidth(photo);
            tempWidth += scaledWidth;
            if (tempWidth < this._containerWidth) {
                rows[rowCount].push(photo);                
                rowWidths[rowCount] = tempWidth;
            } else {           
                rowCount++;
                tempWidth = scaledWidth;                
                rows[rowCount] = new Array();                
                rows[rowCount].push(photo);          
                rowWidths[rowCount] = tempWidth;                      
            }
        }        
        // we handle special case where we have 1 left in last row
        if (rows[rowCount].length == 1 && rowCount > 0) {
            rows[rowCount - 1].push(photo);
            rowWidths[rowCount - 1] += this.getScaledWidth(photo);
            rows.pop();
            rowWidths.pop();
        }
        
        return {rows: rows, rowWidths: rowWidths};
    },
    
    renderRows: function(rows, rowWidths) {
        var str = '';
        for (var i = 0; i < rows.length; i++) {
            str += this.renderRow(rows[i], rowWidths[i]);
        }
        $('#' + this._renderTargetId).html(str);
    },
    
    // row is an array of photos
    renderRow: function(rowPhotos, tempWidth) {
        var str = '';
        var ratio = this._containerWidth / tempWidth;
        for (var i = 0; i < rowPhotos.length; i++) {
            var photo = rowPhotos[i];
            var finalWidth = this.getScaledWidth(photo) * ratio;
            var finalHeight = this._targetHeight * ratio;
            str += '<div style="position: relative; display: inline-block; width: ' + finalWidth + 'px; height: ' + finalHeight + 'px;">'
            if (photo.linkUrl) {
                str += '<a href="' + photo.linkUrl + '" target="_blank">';
            }
            str += '<img src="' + photo.url + '" style="clip: rect(' + this._clipSize +'px ' 
                + (finalWidth - this._clipSize) + 'px ' + (finalHeight - this._clipSize) + 'px ' + this._clipSize +'px); width: ' + finalWidth + 'px; height: ' + finalHeight + 'px; position: absolute;"/>'
            if (photo.linkUrl) {
                str += '</a>';
            }
            str += '</div>';
        }
        return str;        
    }    
});