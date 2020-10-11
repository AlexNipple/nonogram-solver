import React, { useEffect, useState } from 'react';
import './App.css';
import Bluebird from 'bluebird';

enum FieldValue {
  empty,
  cross,
  filled
}

const randVal = () => Math.trunc(Math.random() * 3) as FieldValue;

interface FieldConfig {
  rows: Array<number[]>;
  cols: Array<number[]>;
}

const config = {
  rows: [
    [7, 2, 2, 7],
    [1, 1, 1, 2, 1, 1],
    [1, 3, 1, 3, 1, 1, 3, 1],
    [1, 3, 1, 2, 1, 1, 3, 1],
    [1, 3, 1, 2, 1, 3, 1],
    [1, 1, 2, 2, 1, 1],
    [7, 1, 1, 1, 7],
    [2],
    [2, 3, 2, 1, 4],
    [1, 1, 3, 3, 2, 1],
    [3, 1, 3, 2, 2],
    [1, 1, 1, 3, 1, 1],
    [1, 5, 1, 1, 1, 1],
    [1, 1, 1, 1, 3, 1],
    [7, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [1, 3, 1, 1, 1, 2, 2],
    [1, 3, 1, 2, 1, 2, 1, 1],
    [1, 3, 1, 1, 1, 2],
    [1, 1, 2, 1, 1],
    [7, 1, 3, 1]
  ],
  cols: [
    [7, 1, 2, 7],
    [1, 1, 1, 1, 1, 1],
    [1, 3, 1, 1, 1, 3, 1],
    [1, 3, 1, 1, 1, 1, 3, 1],
    [1, 3, 1, 1, 1, 1, 3, 1],
    [1, 1, 2, 1, 1],
    [7, 1, 1, 1, 7],
    [4],
    [4, 2, 2, 2, 2, 2],
    [1, 2, 1, 1, 1, 2, 3],
    [1, 2, 2, 2],
    [2, 3, 1, 1, 1, 1, 1],
    [3, 3, 2, 3, 1, 1],
    [1, 1, 3, 2],
    [7, 1, 1],
    [1, 1, 1, 1, 1, 1, 1],
    [1, 3, 1, 3, 2, 3],
    [1, 3, 1, 2, 2, 1, 1],
    [1, 3, 1, 1, 1, 1, 1],
    [1, 1, 5, 3],
    [7, 1, 1, 2, 1]
  ]
};

const DEFAULT_FIELD_SIZE = 21;

function makeField(size: number) {
  return Array.from({ length: size }).map(
    () =>
      Array.from({ length: size }).map(() => FieldValue.empty) as Array<
        FieldValue
      >
  );
}
async function w(w = 200) {
  return new Promise(res => setTimeout(res, 1));
}

function App() {
  const [fieldSize, setFieldSize] = useState<number>(DEFAULT_FIELD_SIZE);
  const [fieldSizeText, setFieldSizeText] = useState<string>(
    `${DEFAULT_FIELD_SIZE}`
  );
  const [field, setField] = useState<Array<Array<FieldValue>>>(
    makeField(DEFAULT_FIELD_SIZE)
  );
  const [isDone, setIsDone] = useState<boolean>(false);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [activeCol, setActiveCol] = useState<number | null>(null);

  function setValue(i: number, j: number, value: FieldValue) {
    field[i][j] = value;

    const newField = [...field];

    setField(newField);

    return newField;
  }

  async function solve() {
    const getCol = (n: number) => field.map(row => row[n]);
    const getRow = (n: number) => field[n];

    const getAllOptions = (conf: number[], debug = false) => {
      const addSegment = (
        arr: FieldValue[],
        segNum: number
      ): FieldValue[][] => {
        const result: FieldValue[][] = [];
        const segment = conf[segNum];

        let spaceSize = segNum === 0 ? 0 : 1;

        for (; spaceSize + segment + arr.length <= fieldSize; spaceSize++) {
          if (debug)
            console.log('addSegment for', arr.length, spaceSize, segment);

          result.push(
            ([] as FieldValue[]).concat(
              arr,
              Array.from({ length: spaceSize }).fill(
                FieldValue.cross
              ) as FieldValue[],
              Array.from({ length: segment }).fill(
                FieldValue.filled
              ) as FieldValue[]
            )
          );
        }

        if (debug) console.log('addSegment', arr, segNum, result);

        return result;
      };

      let opts: FieldValue[][] = [[]];

      for (let segNum = 0; segNum < conf.length; segNum++) {
        opts = ([] as FieldValue[][]).concat(
          ...opts.map(opt => addSegment(opt, segNum))
        );
      }

      return opts;
    };

    const getAllOptionsFiltered = (conf: number[], debug = false) =>
      getAllOptions(conf, false)
        .filter(
          opt =>
            opt.length <= fieldSize &&
            opt.filter(v => FieldValue.filled === v).length ===
              conf.reduce((sum, v) => sum + v, 0)
        )
        .map(opt => [
          ...opt,
          ...(Array.from({ length: fieldSize - opt.length }).fill(
            FieldValue.cross
          ) as FieldValue[])
        ]);

    const count = () =>
      field.reduce(
        (sum, c) =>
          sum +
          c.reduce((sum, a) => sum + (a === FieldValue.filled ? 1 : 0), 0),
        0
      );

    const countConfig = () =>
      config.rows.reduce((sum, v) => sum + v.reduce((sum, a) => sum + a, 0), 0);

    const countRow = (n: number) =>
      getRow(n).reduce((sum, n) => sum + (n !== FieldValue.empty ? 1 : 0), 0);
    const countCol = (n: number) =>
      getCol(n).reduce((sum, n) => sum + (n !== FieldValue.empty ? 1 : 0), 0);

    const countConfigRow = (n: number) =>
      config.rows[n].reduce((sum, a) => sum + a, 0);
    const countConfigCol = (n: number) =>
      config.cols[n].reduce((sum, a) => sum + a, 0);

    const allOptionsPrepared = {
      rows: config.rows.map(c => getAllOptionsFiltered(c)),
      cols: config.cols.map(c => getAllOptionsFiltered(c))
    };

    while (true) {
      if (count() === countConfig()) {
        setIsDone(true);
        break;
      }

      for (let i = 0; i < fieldSize; i++) {
        setActiveRow(i);
        const opened = countRow(i);
        if (opened === fieldSize) {
          await w(100);
          continue;
        }

        const row = getRow(i);

        const allOptions = allOptionsPrepared.rows[i];

        const allOptionsFiltered = allOptions.filter(opt => {
          const wrong = opt.find(
            (v, index) => row[index] !== FieldValue.empty && row[index] !== v
          );

          return !wrong;
        });

        allOptionsPrepared.rows[i] = allOptionsFiltered;

        const sames = (Array.from({ length: fieldSize }).fill(
          false
        ) as boolean[]).map((_, index) => {
          return new Set(allOptionsFiltered.map(opt => opt[index])).size === 1;
        });

        await Bluebird.each(sames, async (same, index) => {
          if (same && field[i][index] !== allOptionsFiltered[0][index]) {
            setValue(i, index, allOptionsFiltered[0][index]);

            await w(200);
          }
        });

        await w();
      }
      setActiveRow(null);

      for (let j = 0; j < fieldSize; j++) {
        setActiveCol(j);
        const opened = countCol(j);
        if (opened === fieldSize) {
          await w(100);
          continue;
        }

        const row = getCol(j);

        const allOptions = allOptionsPrepared.cols[j];

        const allOptionsFiltered = allOptions.filter(opt => {
          const wrong = opt.find(
            (v, index) => row[index] !== FieldValue.empty && row[index] !== v
          );

          return !wrong;
        });

        allOptionsPrepared.cols[j] = allOptionsFiltered;

        const sames = (Array.from({ length: fieldSize }).fill(
          false
        ) as boolean[]).map((_, index) => {
          return new Set(allOptionsFiltered.map(opt => opt[index])).size === 1;
        });

        await Bluebird.each(sames, async (same, index) => {
          if (same && field[index][j] !== allOptionsFiltered[0][index]) {
            setValue(index, j, allOptionsFiltered[0][index]);

            await w(200);
          }
        });

        await w();
      }
      setActiveCol(null);
    }
  }

  return (
    <div className="App">
      <label htmlFor={'field-size'}>Field size</label>
      <input
        type={'number'}
        value={fieldSizeText}
        onChange={e => {
          const size = Math.max(10, parseInt(e.target.value) || 10);
          setFieldSize(size);
          setFieldSizeText(e.target.value);
          setField(makeField(size));
        }}
        id={'field-size'}
      />

      <table style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <td></td>
            {Array.from({ length: fieldSize }).map((_, i) => (
              <td
                key={i}
                style={{
                  paddingBottom: 5,
                  verticalAlign: 'bottom',
                  textAlign: 'center',
                  opacity:
                    field
                      .map(row => row[i])
                      .reduce(
                        (sum, v) => sum + (v === FieldValue.filled ? 1 : 0),
                        0
                      ) === config.cols[i].reduce((sum, n) => sum + n, 0)
                      ? 0.2
                      : 1
                }}
              >
                {config.cols[i].map((n, ii) => (
                  <div key={ii}>{n}</div>
                ))}
              </td>
            ))}
          </tr>
        </thead>
        <tbody>
          {field.map((row, i) => (
            <tr key={i}>
              <td
                style={{
                  paddingRight: 5,
                  textAlign: 'right',
                  opacity:
                    field[i].reduce(
                      (sum, v) => sum + (v === FieldValue.filled ? 1 : 0),
                      0
                    ) === config.rows[i].reduce((sum, n) => sum + n, 0)
                      ? 0.2
                      : 1
                }}
              >
                {config.rows[i].map((n, ii) => (
                  <span key={ii}>{n} </span>
                ))}
              </td>
              {row.map((col, j) => (
                <td
                  key={`${i}-${j}`}
                  style={{
                    background:
                      col === FieldValue.filled
                        ? isDone
                          ? '#24652c'
                          : 'black'
                        : 'transparent',
                    transition: isDone ? 'background-color 1s, color 1s' : '',
                    margin: 2,
                    color:
                      col === FieldValue.cross
                        ? isDone
                          ? 'rgba(0,0,0,0.2)'
                          : 'black'
                        : 'black',
                    border: '1px solid #ddd',
                    width: 35,
                    height: 35,

                    verticalAlign: 'center',
                    textAlign: 'center',
                    borderBottom: !((i + 1) % 5)
                      ? '2px solid black'
                      : '1px solid #ddd',
                    borderRight: !((j + 1) % 5)
                      ? '2px solid black'
                      : '1px solid #ddd',
                    borderTop: !(i % 5) ? '2px solid black' : '1px solid #ddd',
                    borderLeft: !(j % 5) ? '2px solid black' : '1px solid #ddd',
                    borderColor:
                      activeRow === i || activeCol === j ? '#0792E0' : ''
                  }}
                >
                  {col === FieldValue.empty
                    ? null
                    : col === FieldValue.cross
                    ? 'X'
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>

      <button
        onClick={async e => {
          e.preventDefault();
          await solve();
        }}
      >
        Solve
      </button>
    </div>
  );
}

export default App;
