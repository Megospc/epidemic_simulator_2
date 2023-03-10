var logs = sessionStorage.getItem('epidemic_simulator_logs');
var frames = [], props = new Map();
if (logs) {
  document.getElementById('logs').value = logs;
  document.getElementById('logs').style.display = 'block';
  document.getElementById('div').style.display = 'block';
  parse(logs);
} else {
  document.getElementById('file').style.display = 'block';
}
function download() {
  let blob = new Blob([logs], { type: "text/plain" });
  let a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `epidemic_simulator_logs.txt`;
  a.click();
}
function read(file) {
  let reader = new FileReader();
  reader.readAsText(file);
  reader.onload = function() {
    logs = reader.result;
    document.getElementById('logs').value = logs;
    document.getElementById('logs').style.display = 'block';
    document.getElementById('div').style.display = 'block';
    document.getElementById('file').style.display = 'none';
    parse(logs);
  };
}
function parse(txt) {
  let res = (txt) => document.getElementById('result').value += txt + "\n";
  let str = "";
  let arr = [];
  for (let i = 0; i < txt.length; i++) {
    if (txt[i] == "\n") {
      arr.push(str);
      str = "";
    } else {
      str += txt[i];
    }
  }
  if (arr[0] == "EPIDEMIC_SIMULATOR_2_LOGS:") {
    res("Начало обработки...");
    let keyval = function(txt) {
      let key = "";
      let value = "";
      let i = 0;
      for (i = 0; txt[i] != "=" && i < txt.length; i++) {
        if (txt[i] != " ") key += txt[i];
      }
      if (i == txt.length) return null;
      for (i += 2; i < txt.length; i++) {
        value += txt[i];
      }
      return { key: key, val: value };
    };
    let i = 0;
    for (i = 1; i < arr.length; i++) {
      let s = keyval(arr[i]);
      if (s) {
        props.set(s.key, s.val);
        res(`Прочитано свойство '${s.key}'`);
      } else {
        res("Свойства прочитанны..");
        break;
      }
    }
    if (props.get('version') && props.get('name') && props.get('json') && props.get('date') && props.get('frames')) {
      res("Общяя информация:");
      const versions = new Map([
        ["2.5.8", "09.03.2023"],
        ["2.5.11", "10.03.2023"]
      ]);
      res(`Версия программы: ${props.get('version')} (${versions.get(props.get('version')) ?? "неизвестная"})`);
      res(`Дата: ${new Date(Number(props.get('date')))}`);
      res(`Имя: ${props.get('name')}`);
      res(`Длина: ${props.get('frames')}`);
      res("Начало обработки кадров...");
      let f = function() {
        let bool = true, j = 0, n = "", s = "FRAME ";
        for (j = 0; j < s.length; j++) {
          if (arr[i][j] != s[j]) {
            bool = false;
            break;
          }
        }
        if (bool) {
          for (; arr[i][j] != " " && j < arr[i].length; j++) n += arr[i][j];
          if (Number(n) == frames.length) {
            res(`Обработка кадра ${Number(n)}`);
            let obj = { arr: [], sum: 0, perf: 0 }
            i++;
            let str = "";
            for (let k = 0; arr[i][k] != "|"; k++) {
              if (arr[i][k] != " ") str += arr[i][k];
            }
            if (isFinite(Number(str))) obj.sum = Number(str);
            else res("Синтаксическая ошибка код: 2");
            let l = 0;
            i++;
            while(str != "donein") {
              str = "";
              for (l = 0; l < arr[i].length && arr[i][l] != "|" && str != "donein"; l++) {
                if (arr[i][l] != " ") str += arr[i][l];
              }
              if (str != "donein") {
                if (isFinite(Number(str))) obj.arr.push(Number(str));
                else {
                  res("Синтаксическая ошибка код: 3");
                  return;
                }
                i++;
              }
            }
            str = "";
            for (; l < arr[i].length && arr[i][l] != "m"; l++) {
              if (arr[i][l] != " ") str += arr[i][l];
            }
            if (isFinite(Number(str))) obj.perf = Number(str);
            else {
              res("Синтаксическая ошибка код: 4");
              return;
            }
            frames.push(obj);
            res(`Результат: ${JSON.stringify(obj)}`);
          }
          else {
            res(`Ошибка: кадр с неправильным номером ${n}`);
            return;
          }
        }
        i++;
        if (i < arr.length) setTimeout(f, 0);
      }
      f();
    } else {
      res("Синтаксическая ошибка код: 1");
      return;
    }
  } else {
    res("Синтаксическая ошибка код: 0");
    return;
  }
  document.getElementById('edit').style.display = 'block';
}
function edit() {
  let w = open('index.html');
  w.$('editor').style.display = 'none';
  w.$('opengame').style.display = 'block';
  w.readgame(props.get('json'));
}
