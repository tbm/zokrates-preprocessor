'use strict'
/**
This code module will pre-process a .code file.  That's so we can add ways
to make them much easier to write.
See the tools-pcode-README.md for a more comprehensive guide on its use.
*/

const argv = require('yargs').argv
const fs = require('fs')
const os = require('os')

var pcode = argv.i

preProp1(pcode)

function preProp1(pcode) {
  if (pcode) {
    let dataWhole = fs.readFileSync(pcode).toString("UTF8")

    dataWhole = outerEllipsisNewLine(dataWhole)
    dataWhole = outerEllipsisNewLine(dataWhole) // do it twice to pick up on nestings of the form { * { *# } }

    let dataLines = dataWhole.toString("UTF8").split(os.EOL)
    let codeData = preProp2(dataLines)
    console.log(codeData)
  } else console.log("No input file specified, running in TEST MODE")
}

function preProp2(data) {

  return isTrueEllipsis(
    typeRepeat(
      innerEllipsis(
        outerEllipsisCommaSeparate(
          outerEllipsisCommaSeparate(// run 'outerEllipsisCommaSeparate' twice to pick up on nestings of the form [ * [ *# ]]
            stringRepeat(
              data)
          )
        )
      )
    )
  ).join(os.EOL)
}

/**
4 dots '....'' results in constant repetition of a string.
This was inspired by the need to add padding with hundreds of 0's.
E.g.
128....0 will produce a string 0, 0, 0, ..., 0 (128 0's)
or
4....word01 will produce a string of word01, word01, word01, word01
*/
function stringRepeat(data) {
  var cpData = [...data]
  return cpData.map(el =>
    el.replace(/([0-9]+)(\.\.\.\.)([a-zA-Z0-9]+?)/g, (m, n, d, s) => {

      //m entire matched string
      //n number of repetitions
      //d dots
      //s string to repeat n times


      n = parseInt(n) //get the first number
      var a = new Array(n).fill(s)
      return a.map(el => el.toString()).join(", ")
    })
  )
}

/**
This 'pass' allows long 'phrases' to be repeated, with decreasing arguments.
E.g.
return [XOR(a*, b*, c0)]3...0 will translate to:
return XOR(a3, b3, c0), XOR(a2, b2, c0), XOR(a1, b1, c0), XOR(a0, b0, c0)
return [a*, b2...0]3...0 will first expand the outside brackets to:
a3, b2...0, a2, b2...0, a1, b2...0, a0, b2...0
And secondly then to:
a3, b2, b1, b0, a2, b2, b1, b0, a1, b2, b1, b0, a0, b2, b1, b0
*/
function outerEllipsisCommaSeparate(data) {
  var cpData = [...data]
  return cpData.map(el =>
    el.replace(/\[+(.+?)]+([0-9]+)\.\.\.([0-9]+)/g, (m, b2, n, k) => {
      //m entire matched string
      //b2 square brackets (interior only)
      //n high number
      //k low number
      n = parseInt(n) //get the first number
      k = parseInt(k)
      b2 == undefined ? b2 = "" : b2 = b2

      if (n >= k) {//decreasing list
        var a = new Array(n - k + 1).fill(b2)
        return a.map(str => str.replace(/(\*)(?!#)/g, n--).replace(/(#)/g,"").toString()).join(", ")
        /*
        Replace a * symbol with a number.
        If there is a sequence *#, then on the first pass, we won't replace it with a number just yet. We'll remove the # symbol on the first pass, so that on the next iteration through outerEllipsisNewLine, we'll make the replacement of *.
        This enables nesting of [ * [ *# ]] (only one level of nesting). First the standalone * is replaced with a number. Then the *# is replaced with *. Then on the next pass, the * is replaced with a number.
        */
      } else {
        var a = new Array(k - n + 1).fill(b2)
        return a.map(str => str.replace(/(\*)(?!#)/g, n++).replace(/(#)/g,"").toString()).join(", ")
        /*
        Replace a * symbol with a number.
        If there is a sequence *#, then on the first pass, we won't replace it with a number just yet. We'll remove the # symbol on the first pass, so that on the next iteration through outerEllipsisNewLine, we'll make the replacement of *.
        This enables nesting of [ * [ *# ]] (only one level of nesting). First the standalone * is replaced with a number. Then the *# is replaced with *. Then on the next pass, the * is replaced with a number.
        */
      }
    })
  )
}

/*
As per outerEllipsisCommaSeparate, except instead of outputting a comma-separated list, it outputs the data on new lines. Syntax: a tilda '~' at the end denotes this 'new line' behaviour.

E.g.
return {a*b63...0}7...0 will first expand the outside brackets to give:
a7b63...0
a6b63...0
...
a0b63...0
And secondly then to:
a7b63, a7b62, a7b61,..., a7b0
a6b63, a6b62, a6b61,..., a6b0
...
a0b63, a0b62, a0b61,..., a0b0
*/

function outerEllipsisNewLine(data) {
  var cpData = data
  var out = []
  var m
  return cpData.replace(/{+([^}]+.+)(\n)*}+?([0-9]+)\.+\.+\.+([0-9]+)/g, (m, s, x1, n, k) => {
    //console.log("m" + m, "s" + s, "x1" + x1, "n" + n, "k" + k)
    if (n >= k) {//decreasing list
      var a = new Array(n - k + 1).fill(s)
      var b = a.map(el => el.replace(/(\*)(?!#)/g, n--).replace(/(#)/g,"").toString()).join("\n\n\n\t\t")
      /*
      Replace a * symbol with a number.
      If there is a sequence *#, then on the first pass, we won't replace it with a number just yet. We'll remove the # symbol on the first pass, so that on the next iteration through outerEllipsisNewLine, we'll make the replacement of *.
      This enables nesting of [ * [ *# ]] (only one level of nesting). First the standalone * is replaced with a number. Then the *# is replaced with *. Then on the next pass, the * is replaced with a number.
      */
    } else {
      var a = new Array(k - n + 1).fill(s)
      var b = a.map(el => el.replace(/(\*)(?!#)/g, n++).replace(/(#)/g,"").toString()).join("\n\n\n\t\t")
      /*
      Replace a * symbol with a number.
      If there is a sequence *#, then on the first pass, we won't replace it with a number just yet. We'll remove the # symbol on the first pass, so that on the next iteration through outerEllipsisNewLine, we'll make the replacement of *.
      This enables nesting of [ * [ *# ]] (only one level of nesting). First the standalone * is replaced with a number. Then the *# is replaced with *. Then on the next pass, the * is replaced with a number.
      */
    }
    return b
  })
}

/**
Ellipsis are sytax for 'decreasing repetition'.
This 'pass' expands out ellipsis (without brackets) and changes £ to 'private'
E.g.:
'£b63...0' is expanded to 'private b63, private b62,...,private b1, private b0'
or
'b63...0' is expanded to 'b63, b62,..., b1, b0'
or
'b63...32' is expanded to 'b63, b62,..., b33, b32'
*/
function innerEllipsis(data) {
  var cpData = [...data]
  return cpData.map(el =>
    el.replace(/('.*?'?)?(£?)([a-zA-Z0-9]*?[a-zA-Z]+?)([0-9]+)\.\.\.([0-9]+)/g, (m, t1, p, s, n, k) => {
      //m entire matched string
      //t1 type (e.g. 'field')
      //p 'pound' sign (private)
      //s string preceding the numbering
      //n number high
      //k number low - we repeat s (plus a number) (n-k+1)-times

      t1 == undefined ? t1 = "" : t1 = t1 + " "
      //t2==undefined?t2="":t2=t2+" "
      n = parseInt(n) //get the first number
      k = parseInt(k)

      if (n >= k) {
        var a = new Array(n - k + 1).fill(p.replace(/£/, "private ") + t1.replace(/'/g, "") + s)
        return a.map(el => el + (--n + 1).toString()).join(", ")
      } else {
        var a = new Array(k - n + 1).fill(p.replace(/£/, "private ") + t1.replace(/'/g, "") + s)
        return a.map(el => el + (++n - 1).toString()).join(", ")
      }

    })
  )
}

/**
In function definitions, zokrates DSL now requires you to specify the number of output elements (and their type) with a list (field, field,..., field). The only supported types are bool, field and field[n] at the moment. We restrict this preprocessor to return 'field' types only for simplicity for now.
E.g.
def main(£b64...)->(field3): will be converted to:
After Pass1:
def main(b63, b62,..., b1, b0)->(field3):
After Pass2:
def main(b63, b62,..., b1, b0)->(field, field, field):

Note: no spaces allowed in the string segment ->(field3):
*/
function typeRepeat(data) {
  var cpData = [...data]
  return cpData.map(el =>
    el.replace(/\-\>\(([a-zA-Z]+)([0-9]+)\)\:/g, (m, t, n) => {

      //m entire matched string
      //t type to repeat (e.g. field)
      //n number of repetitions

      n = parseInt(n) //get the number of outputs
      var a = new Array(n).fill(t)
      return "->(" + a.map(el => el.toString()).join(", ") + "):"
    })
  )
}

/**
Ellipsis are sytax for 'decreasing repetition'.
This 'pass' expands out == lines
E.g.
A==63...0==B
will expand to:
A0 == B0
A1 == B1
A2 == B2
...
A63 == B63
*/
function isTrueEllipsis(data) {
  var cpData = [...data]
  var out = []
  cpData.forEach(el => {
    var m
    if (m = el.match(/([a-zA-Z0-9]+?)==([0-9]+)\.\.\.([0-9]+)==([a-zA-Z0-9]+)/)) {
      //console.log(m)
      for (var i = m[3]; i <= m[2]; i++) {
        out.push(m[1] + i.toString() + " == " + m[4] + i.toString())
      }
    } else {
      out.push(el)
    }
  })
  return out
}

module.exports = {
  preProp1
}
