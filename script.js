const input = document.getElementById("inputbox");
const buttons = document.querySelectorAll("button");

let string = "";
let Ans = "";
let lastPressed = "";
let shiftMode = false;

function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  return b ? gcd(b, a % b) : a;
}

function decimalToFraction(decimal) {
  if (!isFinite(decimal)) return "NaN";
  if (decimal % 1 === 0) return `${decimal}/1`;
  const sign = decimal < 0 ? -1 : 1;
  decimal = Math.abs(decimal);
  const str = decimal.toString();
  const decimalPlaces = (str.split(".")[1] || "").length;
  const denominator = Math.pow(10, decimalPlaces);
  const numerator = Math.round(decimal * denominator);
  const g = gcd(numerator, denominator);
  return `${sign * (numerator / g)}/${denominator / g}`;
}

function fractionToDecimal(frac) {
  if (typeof frac !== "string") return NaN;
  const parts = frac.trim().split("/");
  if (parts.length !== 2) return NaN;
  const num = Number(parts[0].trim());
  const den = Number(parts[1].trim());
  if (!isFinite(num) || !isFinite(den) || den === 0) return NaN;
  return num / den;
}

function convertScientific(expr) {
  expr = expr.replace(/sin\(([^()]+)\)/g, "Math.sin(($1)*Math.PI/180)");
  expr = expr.replace(/cos\(([^()]+)\)/g, "Math.cos(($1)*Math.PI/180)");
  expr = expr.replace(/tan\(([^()]+)\)/g, "Math.tan(($1)*Math.PI/180)");
  expr = expr.replace(/ln\(([^()]+)\)/g, "Math.log($1)");
  expr = expr.replace(/log\(([^()]+)\)/g, "Math.log10($1)");
  expr = expr.replace(/√\(([^()]+)\)/g, "Math.sqrt($1)");
  return expr;
}


function normalizeExpression(expr) {
  expr = convertScientific(expr);
  expr = expr.replace(/π/g, `(${Math.PI})`);
  expr = expr.replace(/\bAns\b/g, `(${Ans === "" ? 0 : Ans})`);
  expr = expr.replace(/(\d|\))\s*(?=\()/g, "$1*(");
  expr = expr.replace(/(\d|\))\s*(?=(π|Ans|Math))/g, "$1*");
  return expr;
}

function isSafeExpression(expr) {
  const whitelist = /^[0-9+\-*/%^().,\sA-Za-z:>=>=<\*\*]*$/;
  if (!expr || typeof expr !== "string") return false;
  const forbidden = /(window|document|eval|Function|fetch|localStorage|sessionStorage|require|process|constructor|import|while|for)/i;
  if (forbidden.test(expr)) return false;
  return whitelist.test(expr);
}

function safeEval(expr) {
  const normalized = normalizeExpression(expr);
  if (!isSafeExpression(normalized)) throw new Error("Unsafe expression");
  const fn = new Function(`return (${normalized});`);
  return fn();
}

buttons.forEach(btn => {
  btn.addEventListener("click", e => {
    const value = e.target.innerHTML.trim();

    if (value === "=" && lastPressed === "=") {
      string = "";
      input.value = "";
      lastPressed = "";
      return;
    }

    if (value === "AC") {
      string = "";
      input.value = "";
    }

    else if (value === "DEL") {
      string = string.slice(0, -1);
      input.value = string;
    }

    else if (value === "=") {
      try {
        const result = safeEval(string);
        const display = (typeof result === "number" && !Number.isInteger(result))
          ? Number(result.toPrecision(12)).toString()
          : String(result);
        input.value = display;
        Ans = display;
        string = display;
      } catch {
        input.value = "Error";
        string = "";
      }
    }

    else if (["sin","cos","tan","log","ln","√"].includes(value)) {
      string += value + "(";
      input.value = string;
    }

    else if (value === "SHIFT") {
      shiftMode = !shiftMode;
      const shiftEl = document.getElementById("shift");
      if (shiftEl) shiftEl.style.background = shiftMode ? "yellow" : "#c2f0ff";
      lastPressed = value;
      return;
    }

    else if (value === "a↔b") {
      if (!shiftMode) return;
      const current = input.value.trim();
      if (!current) return;

      if (current.includes("/")) {
        const dec = fractionToDecimal(current);
        input.value = dec;
        string = String(dec);
      } else {
        const d = Number(current);
        if (isNaN(d)) {
          input.value = "Error";
          string = "";
        } else {
          const f = decimalToFraction(d);
          input.value = f;
          string = f;
        }
      }

      shiftMode = false;
      const shiftEl = document.getElementById("shift");
      if (shiftEl) shiftEl.style.background = "#c2f0ff";
      lastPressed = value;
      return;
    }

    else if (value === "x²") {
      string += "**2";
      input.value = string;
    }

    else if (value === "1/x") {
      if (!string) string = Ans || "0";
      string = `1/(${string})`;
      input.value = string;
    }

    else if (value === "π") {
      if (string && /[0-9)\.]/.test(string.slice(-1))) string += "*";
      string += "π";
      input.value = string;
    }

    else if (value === "e") {
      if (string && /[0-9)\.]/.test(string.slice(-1))) string += "*";
      string += String(Math.E);
      input.value = string;
    }

    else if (value === "Ans") {
      if (string && /[0-9)\.]/.test(string.slice(-1))) string += "*";
      string += "Ans";
      input.value = string;
    }

    else if (value === "EXP") {
      if (!string) string = "1e";
      else {
        const last = string.slice(-1);
        if (/[0-9]/.test(last)) string += "e";
        else string += "e";
      }
      input.value = string;
    }

    else if (value === "^") {
      string += "**";
      input.value = string;
    }

    else {
      if (/[+\-*/%^.]$/.test(string) && /^[+\-*/%^.]$/.test(value)) {
        if (value === "*" && string.slice(-1) === "*") {
          string = string.slice(0, -1) + "**";
        } else {
          string = string.slice(0, -1) + value;
        }
      } else {
        string += value;
      }
      input.value = string;
    }

    lastPressed = value;
  });
});
