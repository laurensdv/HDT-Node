var hdtNative = require('../build/Release/hdt');

// Maximum representable integer
var MAX_INTEGER = Math.pow(2, 32) - 1;

// Auxiliary functions to attach to native HdtDocument instances
var HdtDocumentPrototype = {};

// Searches the document for triples with the given subject, predicate, and object.
HdtDocumentPrototype.search = function (subject, predicate, object, options, callback, self) {
  if (typeof  callback !== 'function') self = callback, callback = options, options = {};
  if (typeof  callback !== 'function') return;
  if (this.closed) return callback.call(self || this,
                          new Error('The HDT document cannot be read because it is closed'));
  if (typeof   subject !== 'string' ||   subject[0] === '?') subject   = '';
  if (typeof predicate !== 'string' || predicate[0] === '?') predicate = '';
  if (typeof    object !== 'string' ||    object[0] === '?') object    = '';
  var offset = options && options.offset ? Math.max(0, parseInt(options.offset, 10)) : 0,
      limit  = options && options.limit  ? Math.max(0, parseInt(options.limit,  10)) : MAX_INTEGER;

  this._search(subject, predicate, object, offset, limit, callback, self);
};

// Gives an approximate number of matches of triples with the given subject, predicate, and object.
HdtDocumentPrototype.count = function (subject, predicate, object, callback, self) {
  this.search(subject, predicate, object, { offset: 0, limit: 0 },
    function (error, triples, totalCount) { callback.call(this, error, totalCount); }, self);
};

module.exports = {
  // Creates an HDT document for the given file.
  fromFile: function (filename, callback, self) {
    if (typeof callback !== 'function') return;
    if (typeof filename !== 'string' || filename.length === 0)
      return callback.call(self, Error('Invalid filename: ' + filename));

    // Construct the native HdtDocument
    hdtNative.createHdtDocument(filename, function (error, document) {
      if (error) {
        // Parse the error message
        switch (error.message) {
        case 'Error opening HDT file for mapping.':
          return callback.call(self, Error('Could not open HDT file "' + filename + '"'));
        case 'Non-HDT Section':
          return callback.call(self, Error('The file "' + filename + '" is not a valid HDT file'));
        default:
          return callback.call(self, error);
        }
      }

      // Attach the auxiliary functions from the prototype
      for (var name in HdtDocumentPrototype)
        document[name] = HdtDocumentPrototype[name];
      callback.call(self, null, document);
    });
  },
};
