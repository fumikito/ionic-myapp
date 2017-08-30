import {WpArgumentsError, WpCredentialError} from "./wp-errors";
import {WpCredential} from "./wp-credential";
import {Http, Headers} from '@angular/http'
import {WpRequestData} from "./wp-request-data";

export class WpOauthCypher{

  static b64:string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';

  static blockSize:number = 64;

  constructor(http:Http){}

  static bToA (string:string):string {
    let i, length = string.length, ascii, index, output = '';

    for (i = 0; i < length; i+=3) {
      ascii = [
        string.charCodeAt(i),
        string.charCodeAt(i+1),
        string.charCodeAt(i+2)
      ];

      index = [
        ascii[0] >> 2,
        ((ascii[0] & 3) << 4) | ascii[1] >> 4,
        ((ascii[1] & 15) << 2) | ascii[2] >> 6,
        ascii[2] & 63
      ];

      if (isNaN(ascii[1])) {
        index[2] = 64;
      }
      if (isNaN(ascii[2])) {
        index[3] = 64;
      }

      output += this.b64.charAt(index[0]) + this.b64.charAt(index[1]) + this.b64.charAt(index[2]) + this.b64.charAt(index[3]);
    }

    return output;
  };

  static hmacSha1(consumer_secret:string, token_secret:string, signature_base:string):string{

    let passPhrase:string, signature:string;

    consumer_secret = this.urlEncode(consumer_secret);
    token_secret = this.urlEncode(token_secret || '');

    passPhrase = consumer_secret + '&' + token_secret;
    signature = this.hmac(passPhrase, signature_base);

    return this.bToA(signature);
  }

  /**
   * Generate a timestamp for the request
   */
  static getTimestamp() {
    let now = new Date();
    return Math.floor(now.getTime() / 1000);
  }

  static rand(){

  }

  /**
   * Generate a nonce for the request
   *
   * @param key_length {number} Optional nonce length
   */
  static getNonce(key_length:number = 64) {
    let key_bytes = key_length / 8,
      value = '',
      key_iter = key_bytes / 4,
      key_remainder = key_bytes % 4,
      i,
      chars = ['20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
        '2A', '2B', '2C', '2D', '2E', '2F', '30', '31', '32', '33',
        '34', '35', '36', '37', '38', '39', '3A', '3B', '3C', '3D',
        '3E', '3F', '40', '41', '42', '43', '44', '45', '46', '47',
        '48', '49', '4A', '4B', '4C', '4D', '4E', '4F', '50', '51',
        '52', '53', '54', '55', '56', '57', '58', '59', '5A', '5B',
        '5C', '5D', '5E', '5F', '60', '61', '62', '63', '64', '65',
        '66', '67', '68', '69', '6A', '6B', '6C', '6D', '6E', '6F',
        '70', '71', '72', '73', '74', '75', '76', '77', '78', '79',
        '7A', '7B', '7C', '7D', '7E'];

    let rand = () => {
      return Math.floor(Math.random() * chars.length);
    };

    for (i = 0; i < key_iter; i++) {
      value += chars[rand()] + chars[rand()] + chars[rand()]+ chars[rand()];
    }

    // handle remaining bytes
    for (i = 0; i < key_remainder; i++) {
      value += chars[rand()];
    }

    return value;
  }

  /**
   * Convert integer to Hex
   *
   * @param {number} code
   * @returns {string}
   */
  static toHex(code:number):string{
    let hex = code.toString(16).toUpperCase();
    if (hex.length < 2) {
      hex = 0 + hex;
    }
    return '%' + hex;
  }

  /**
   * Convert URL to be encoded.
   *
   * @param {string} str
   * @returns {string}
   */
  static urlEncode(str:string):string{

    if (!str) {
      return '';
    }

    str = str+ '';
    let reserved_chars = /[ \t\r\n!*"'();:@&=+$,\/?%#\[\]<>{}|`^\\\u0080-\uffff]/,
      str_len = str.length, i, string_arr = str.split(''), c;

    for (i = 0; i < str_len; i++) {
      if (c = string_arr[i].match(reserved_chars)) {
        c = c[0].charCodeAt(0);

        if (c < 128) {
          string_arr[i] = this.toHex(c);
        } else if (c < 2048) {
          string_arr[i] = this.toHex(192+(c>>6)) + this.toHex(128+(c&63));
        } else if (c < 65536) {
          string_arr[i] = this.toHex(224+(c>>12)) + this.toHex(128+((c>>6)&63)) + this.toHex(128+(c&63));
        } else if (c < 2097152) {
          string_arr[i] = this.toHex(240+(c>>18)) + this.toHex(128+((c>>12)&63)) + this.toHex(128+((c>>6)&63)) + this.toHex(128+(c&63));
        }
      }
    }

    return string_arr.join('');
  }


  /**
   * rfc3986 compatable decode of a string
   *
   * @param {String} string
   */
  static urlDecode(string:string):string{
    if (!string) {
      return '';
    }

    return string.replace(/%[a-fA-F0-9]{2}/ig, function (match) {
      return String.fromCharCode(parseInt(match.replace('%', ''), 16));
    });
  };

  /**
   * Convert object to query header string
   *
   * @param {Object} params
   * @returns {string}
   */
  static toHeaderString(params:any): string{
    let arr:Array<string> = [];
    let realm:string = '';
    let i:string;
    for (i in params) {
      if (params.hasOwnProperty(i) && params[i] !== undefined && params[i] !== '') {
        if (i === 'realm') {
          realm = i + '="' + params[i] + '"';
        } else {
          arr.push(i + '="' + this.urlEncode(params[i]+'') + '"');
        }
      }
    }

    arr.sort();
    if (realm) {
      arr.unshift(realm);
    }

    return arr.join(', ');
  }

  static toSignatureBaseString(method, url, header_params, query_params) {
    let arr = [], i, encode = this.urlEncode;

    for (i in header_params) {
      if ( header_params.hasOwnProperty(i) && header_params[i] !== undefined && header_params[i] !== '') {
        arr.push([this.urlEncode(i), this.urlEncode(header_params[i]+'')]);
      }
    }

    for (i in query_params) {
      if (query_params[i] !== undefined && query_params[i] !== '') {
        if (!header_params[i]) {
          arr.push([encode(i), encode(query_params[i] + '')]);
        }
      }
    }

    arr = arr.sort(function(a, b) {
      if (a[0] < b[0]) {
        return -1;
      } else if (a[0] > b[0]) {
        return 1;
      } else {
        if (a[1] < b[1]) {
          return -1;
        } else if (a[1] > b[1]) {
          return 1;
        } else {
          return 0;
        }
      }
    }).map(function(el) {
      return el.join("=");
    });

    return [
      method,
      encode(url),
      encode(arr.join('&'))
    ].join('&');
  }


  static zeroPad(length):Array<string> {
    let arr = new Array(++length);
    return arr.join('0').split('');
  }

  static stringToByteArray(str) {
    let bytes = [], code, i;

    for(i = 0; i < str.length; i++) {
      code = str.charCodeAt(i);

      if (code < 128) {
        bytes.push(code);
      } else if (code < 2048) {
        bytes.push(192+(code>>6), 128+(code&63));
      } else if (code < 65536) {
        bytes.push(224+(code>>12), 128+((code>>6)&63), 128+(code&63));
      } else if (code < 2097152) {
        bytes.push(240+(code>>18), 128+((code>>12)&63), 128+((code>>6)&63), 128+(code&63));
      }
    }

    return bytes;
  }

  static wordsToByteArray(words):Array<string> {
    let bytes = [], i;
    for (i = 0; i < words.length * 32; i += 8) {
      bytes.push((words[i >>> 5] >>> (24 - i % 32)) & 255);
    }
    return bytes;
  }

  static byteArrayToHex(byteArray):string {
    let hex = [], l = byteArray.length, i;
    for (i = 0; i < l; i++) {
      hex.push((byteArray[i] >>> 4).toString(16));
      hex.push((byteArray[i] & 0xF).toString(16));
    }
    return hex.join('');
  }

  static byteArrayToString(byteArray):string {
    let string = '', l = byteArray.length, i;
    for (i = 0; i < l; i++) {
      string += String.fromCharCode(byteArray[i]);
    }
    return string;
  }

  static leftRotate(value, shift):number {
    return (value << shift) | (value >>> (32 - shift));
  }

  /**
   * HMAC-SHA1
   *
   * @param key
   * @param message
   * @param toHex
   * @returns {string}
   */
  static hmac(key:string, message:string, toHex:boolean = false):string{
    let k = this.stringToByteArray(key), m = this.stringToByteArray(message),
      l = k.length, byteArray, oPad, iPad, i;

    if (l > this.blockSize) {
      k = this.sha1(k);
      l = k.length;
    }

    k = k.concat(this.zeroPad(this.blockSize - l));

    oPad = k.slice(0); // copy
    iPad = k.slice(0); // copy

    for (i = 0; i < this.blockSize; i++) {
      oPad[i] ^= 0x5C;
      iPad[i] ^= 0x36;
    }

    byteArray = this.sha1(oPad.concat(this.sha1(iPad.concat(m))));

    if (toHex) {
      return this.byteArrayToHex(byteArray);
    }
    return this.byteArrayToString(byteArray);
  }

  static sha1(m:any):Array<string>{
    let blockSize = 64;

    let H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0],
      K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6],
      lb, hb,
      l, pad, ml, blocks, b, block, bl, w, i, A, B, C, D, E, t, n, TEMP;

    let fn = (t, B, C, D) => {
      switch (t) {
        case 0:
          return (B & C) | ((~B) & D);
        case 1:
        case 3:
          return B ^ C ^ D;
        case 2:
          return (B & C) | (B & D) | (C & D);
      }

      return -1;
    };


    if (m.constructor === String) {
      m = this.stringToByteArray(m.encodeUTF8());
    }

    l = m.length;

    pad = (Math.ceil((l + 9) / this.blockSize) * this.blockSize) - (l + 9);

    hb = (Math.floor(l / 4294967296));
    lb = (Math.floor(l % 4294967296));

    ml = [
      ((hb * 8) >> 24) & 255,
      ((hb * 8) >> 16) & 255,
      ((hb * 8) >> 8) & 255,
      (hb * 8) & 255,
      ((lb * 8) >> 24) & 255,
      ((lb * 8) >> 16) & 255,
      ((lb * 8) >> 8) & 255,
      (lb * 8) & 255
    ];

    m = m.concat([0x80], this.zeroPad(pad), ml);

    blocks = Math.ceil(m.length / this.blockSize);

    for (b = 0; b < blocks; b++) {
      block = m.slice(b * this.blockSize, (b+1) * this.blockSize);
      bl = block.length;

      w = [];

      for (i = 0; i < bl; i++) {
        w[i >>> 2] |= block[i] << (24 - (i - ((i >> 2) * 4)) * 8);
      }

      A = H[0];
      B = H[1];
      C = H[2];
      D = H[3];
      E = H[4];

      for (t=0; t < 80; t++) {
        if (t >= 16) {
          w[t] = this.leftRotate(w[t-3] ^ w[t-8] ^ w[t-14] ^ w[t-16], 1);
        }

        n = Math.floor(t / 20);
        TEMP = this.leftRotate(A, 5) + fn(n, B, C, D) + E + K[n] + w[t];

        E = D;
        D = C;
        C = this.leftRotate(B, 30);
        B = A;
        A = TEMP;
      }

      H[0] += A;
      H[1] += B;
      H[2] += C;
      H[3] += D;
      H[4] += E;
    }

    return this.wordsToByteArray(H);
  }

  /**
   *
   *
   * @param {WpCredential} config
   * @param {string} method
   * @param {string} url
   * @param {Object} data
   * @param {Object} headers
   * @param {string} realm
   * @returns {WpRequestData}
   */
  static makeRequest( config:WpCredential, method:string, url:string, data: object = {}, headers: object = {}, realm:string = '' ):WpRequestData{

    // Set method
    method = method.toUpperCase();
    if ( [ 'GET', 'POST', 'PUT', 'DELETE', 'OPTIONS' ].indexOf(method) < 0 ) {
      throw new WpArgumentsError( method + ' is invalid method.');
    }

    // According to the spec
    let withFile = false;
    Object.keys(data).forEach((paramName) => {
      if (data[paramName] instanceof File || typeof data[paramName].fileName != 'undefined') {
        withFile = true;
      }
    });

    // Build crypto
    let signatureMethod = 'HMAC-SHA1';
    let headerParams = {
      'oauth_callback': config.callbackUrl,
      'oauth_consumer_key': config.clientKey,
      'oauth_token': config.accessToken,
      'oauth_signature_method': signatureMethod,
      'oauth_timestamp': this.getTimestamp(),
      'oauth_nonce': this.getNonce(),
      'oauth_verifier': config.verifier,
      'oauth_version': '1.0',
      'oauth_signature': ''
    };

    let signatureData = {};

    // Handle GET params first
    if ( ['GET', 'DELETE', 'OPTIONS'].indexOf(method) >= 0 ) {
      Object.keys(data).forEach((i) => {
        signatureData[i] = data[i];
      });
    }

    // According to the OAuth spec
    // if data is transfered using
    // multipart the POST data doesn't
    // have to be signed:
    // http://www.mail-archive.com/oauth@googlegroups.com/msg01556.html
    if((!headers['Content-Type'] || headers['Content-Type'] == 'application/x-www-form-urlencoded') && !withFile) {
      Object.keys(data).forEach((i) => {
        signatureData[i] = data[i];
      });
    }

    let signatureString = this.toSignatureBaseString(method, url, headerParams, signatureData);

    headerParams.oauth_signature = this.hmacSha1(config.clientSecret, config.accessTokenSecret, signatureString);

    if (realm.length) {
      headerParams['realm'] = realm;
    }

    // Append query if possible.
    if ( [ 'GET', 'DELETE', 'OPTIONS' ].indexOf(method) >= 0) {
      let query = [];
      Object.keys(data).forEach((key) => {
        query.push(key + '=' + encodeURIComponent(data[key]));
      });
      if (query.length) {
        url += '?' + query.join('&');
      }
      data = {};
    } else if ( ! headers['Content-Type'] ) {
      headers['Content-Type'] = 'application/x-www-form-urlencoded';
    }

    // TODO: withfile stuff.

    // Build header
    let httpHeaders = new Headers();
    httpHeaders.set( 'Authorization', 'OAuth ' + this.toHeaderString( headerParams ) );
    Object.keys(headers).forEach((key) => {
      httpHeaders.set( key, headers[key] );
    });
    let options = {
      headers: httpHeaders
    };

    return {
      method: method,
      url: url,
      options: options,
      data: data
    };
  }


}
