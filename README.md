# Thompson's regular expression to NFA


### Installation
> make sure to have [node](https://nodejs.org/en/download/) installed 
```sh
$ cd Thompson-regToNFA
$ npm start
```
### Example:
change the regExp variable in the code with the required regular expression
```js
const regExp = "a*b*abb";
```
### Output format:
It outputs in the terminal a json object, and saves this json object into a file called nfa.json
```json
{
  "startingState": "S0",
  "S0": { "isTerminatingState": false, "Epsilon": ["S1", "S3"] },
  "S1": { "isTerminatingState": false, "a": ["S2"] },
  "S2": { "isTerminatingState": false, "Epsilon": ["S1", "S3"] },
  "S3": { "isTerminatingState": false, "Epsilon": ["S4", "S6"] },
  "S4": { "isTerminatingState": false, "b": ["S5"] },
  "S5": { "isTerminatingState": false, "Epsilon": ["S4", "S6"] },
  "S6": { "isTerminatingState": false, "a": ["S7"] },
  "S7": { "isTerminatingState": false, "b": ["S8"] },
  "S8": { "isTerminatingState": false, "b": ["S9"] },
  "S9": { "isTerminating": true }
}
```

### NOTE:
> ORing expressions must be in brackets

    - Supported: regExp = "a(a|b)b"
    - Unsupported: regExp = "aa|bb"