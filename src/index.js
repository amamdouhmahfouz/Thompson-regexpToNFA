/**
 * This program converts a regular expression to its respective NFA.
 * Algorithm:
 *  1. Use Shunting-Yard algorithm to convert regular expression 
 *      from infix notation to postfix notation by adding the concatenation
 *      operator '.' and reordering the regular expression so that 
 *      it can be read left to right and ease the conversion operation.
 *      Example: 
 *          input regular expression: a(a|b)ab*
 *          output postfix expression: aab|.a.b*.
 *  2. for each token read from the postfix notation:
 *          if token is in ALPHABET:
 *              create new NFAstate
 *              push to stack
 *          else if token is '.':
 *              left = pop()
 *              right = pop()
 *              concat(left, right)
 *              push to stack
 *          else if token is '|':
 *              left = pop()
 *              right = pop()
 *              or(left, right)
 *              push to stack
 *          else if token is '*':
 *              nfa = pop()
 *              star(nfa)
 *              push to stack
 *      
 *        
 * 
 */

 var fs = require('fs');

const ALPHABET_STATES = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const PRECENDANCE  = {
    '*': 3,
    '.': 2,
    '|': 1
};


const insertBracket = (regExp) => {
    if (!regExp.includes('|')) {
        return regExp;
    }
    let orIndices = [];
    for (let i = 0; i < regExp.length; i++) {
        if (regExp[i] === '|') {
            orIndices.push(i);
        }
    }

    let newRegExp = regExp.slice();
    let k = 0; //to update the index
    for (let i of orIndices) {
        let idx = i + k;
        //if there are already brackets, then skip this or
        if (newRegExp.length > 0 && newRegExp[idx-2] === "(" && newRegExp[idx+2] === ")") continue;
        newRegExp = newRegExp.slice(0,idx-1)+"("+newRegExp.slice(idx-1,idx)+"|"+newRegExp.slice(idx+1)[0]+")"+newRegExp.slice(idx+2)
        k += 2;
    }


    return newRegExp;

}
/**
 * Convert the modified regular expression into a postfix notation
 * @function
 * @param {string} inputRegularExpression - the input regular expression before parsing or any modifications
 * @returns {string} 
 */
const convertToPostfix = (inputRegularExpression) => {
 
    const insertConcat = (regExp) => {

        let newRegExp = "";
        let lastToken = regExp[0];
        let tmpStack = [];
        for (let i = 0; i < regExp.length; i++) {
            newRegExp += regExp[i];
            if (regExp[i] === '(' || regExp[i] === '|') continue;

            if (i < regExp.length - 1) {
                let nextToken = regExp[i+1];
                if (nextToken === '*' || nextToken === '|' || nextToken === ')') continue;

                //adding a concat operator
                newRegExp += '.'; 
            }
    
        }
    
        return newRegExp;
    };

    

    let regExp = insertConcat(insertBracket(inputRegularExpression));

    let newRegExpQueue = '';
    let tmpStack = []; //stack for operators

    for (let i = 0; i < regExp.length; i++) {
        if (regExp[i] === '.' || regExp[i] === '|' || regExp[i] === '*') {
            while (tmpStack.length > 0 && tmpStack[tmpStack.length-1] !== '('
                && PRECENDANCE[tmpStack[tmpStack.length-1]] >= PRECENDANCE[regExp[i]] ) {
                    newRegExpQueue += tmpStack.pop();
                }
            tmpStack.push(regExp[i]);
        } else if (regExp[i] === '(' || regExp[i] === ')') {
            if (regExp[i] === '(') {
                tmpStack.push(regExp[i]);
            } else { // ')'
                while (tmpStack.length > 0 && tmpStack[tmpStack.length-1] !== '(') {
                    //enqueue in the output queue all the operators
                    newRegExpQueue += tmpStack.pop();
                }

                tmpStack.pop();
            }
        } else {
            newRegExpQueue += regExp[i];
        }
    }

    //dequeue all the remainging operators in the stack
    while (tmpStack.length > 0) {
        newRegExpQueue += tmpStack.pop();
    }

    return newRegExpQueue

};

/**
 * Holds all the states transitions
 * @class 
 */
class NFA {
    /**
     * Each NFA container has strictly one start state, and could have multiple endstates
     * or multiple outgoing connections
     */
    constructor() {
        this.startState = null;
        this.endState = null; //could be multiple states, i.e an array
        this.transitions = [];
        this.states = new Set(); //should have unique states
    }

    /**
     * Token can either be a character from the ALPHABET or an Epsilon
     * @param {string} token 
     */
    createFromToken(token) {
        this.startState = 0;
        this.endState = [1];
        this.states.add(this.startState);
        this.states.add(...this.endState);
        this.transitions.push({
            "startState": this.startState,
            "endState": this.endState,
            "input": token
        });

    }

    /**
     * Concatenates two nfa states containers, i.e merges them
     * @function
     * @param {NFA} nfaRight 
     * @returns {NFA}
     */
     concat_v3(nfaRight) {
        let nfa = new NFA();
        let lastMaxState = Math.max(...this.states);

        for (let i = 0; i < nfaRight.transitions.length; i++) {
            nfaRight.transitions[i]["startState"] += lastMaxState;
            nfaRight.transitions[i]["endState"] = nfaRight.transitions[i]["endState"].map(elem => elem + lastMaxState);
        }
        //unify states both from left and right nfa states
        // nfa.states = new Set([...nfa1.states, ...[...nfa2.states].map(elem => elem + lastMaxState)]);
        nfa.states = new Set([...this.states, ...Array.from(nfaRight.states.values(), e => e + lastMaxState)]);
        nfa.startState = this.startState;
        nfa.endState = nfaRight.endState.map(e => e + lastMaxState);
        nfa.transitions = [...nfa.transitions, ...this.transitions, ...nfaRight.transitions];

        return nfa;
    }

    /**
     * ORs the two nfa states.
     * Creates 3 epsilon transitions, one from a state to 2 states, and the 
     * other from 2 states to 1 state
     * @function
     * @param {NFA} nfaRight 
     * @returns {NFA}
     */
     or(nfaRight) {
        let nfa = new NFA();
        let lastMaxState = Math.max(...[...this.states].map(elem => elem + 1));
        
        this.startState += 1;
        this.endState = (typeof this.endState === "object") ? this.endState.map(elem => elem + 1) : this.endState + 1;
        nfaRight.startState += lastMaxState + 1;
        nfaRight.endState = nfaRight.endState.map(elem => elem + lastMaxState + 1);

        for (let i = 0; i < this.transitions.length; i++) {
            this.transitions[i]["startState"] += 1;
            this.transitions[i]["endState"] = this.transitions[i]["endState"].map(elem => elem + 1);
        }

        for (let i = 0; i < nfaRight.transitions.length; i++) {
            nfaRight.transitions[i]["startState"] += lastMaxState + 1;
            nfaRight.transitions[i]["endState"] = nfaRight.transitions[i]["endState"].map(elem => elem + lastMaxState + 1);
        }

        nfa.startState = 0;
        nfa.endState = [...nfaRight.endState.map(elem => elem + 1)];
        nfa.states = new Set([
            nfa.startState, 
            ...[...this.states].map(elem => elem + 1), 
            ...[...nfaRight.states].map(elem => elem + lastMaxState + 1),
            ...nfa.endState
        ]);
        
        // link to upper state and link to lower state
        nfa.transitions.push({
            "startState": nfa.startState,
            "endState": [this.startState, nfaRight.startState],
            "input": "ε"
        });
        

        nfa.transitions = [...nfa.transitions, ...this.transitions, ...nfaRight.transitions];
        
        nfa.transitions.push({
            "startState": this.endState[0],
            "endState": nfa.endState,
            "input": "ε"
        });
        
        nfa.transitions.push({
            "startState": nfaRight.endState[0],
            "endState": nfa.endState,
            "input": "ε"
        });

        return nfa;
        
    }

    /**
     * 
     * @function 
     * @returns {NFA}
     */
     star()  {
        
        //nfa.states = new Set( [nfa.states].map(elem => elem + 1));
        this.states = new Set(Array.from(this.states.values(), e => e + 1));
        
        let nfaStarContainer = new NFA();
        nfaStarContainer.startState = 0;
        this.startState += 1;
        this.endState = this.endState.map(elem => elem + 1);
        
        nfaStarContainer.endState = [...this.endState.map(elem => elem + 1)];

        for (let i = 0; i < this.transitions.length; i++) {
            this.transitions[i]["startState"] += 1;
            this.transitions[i]["endState"] = [...this.transitions[i]["endState"]].map(elem => elem + 1);
        }

        nfaStarContainer.states = new Set([
            nfaStarContainer.startState,
            ...nfaStarContainer.endState,
            ...this.states
        ]);

        nfaStarContainer.transitions = [
            {
                "startState": nfaStarContainer.startState,
                "endState": [this.startState, ...nfaStarContainer.endState],
                "input": "ε"
            },
            ...this.transitions,
            {
                "startState": this.endState[0] || this.endState,
                "endState": [this.startState, ...nfaStarContainer.endState],
                "input": "ε"
            }
        ];

        return nfaStarContainer;

    }
}




const convertToNFA = (postfix) => {

    let nfaStack = [];
    for (token of postfix) {
        if (ALPHABET_STATES.includes(token)) {
            //a symbol not an operator
            let nfa = new NFA();
            nfa.createFromToken(token);
            nfaStack.push(nfa);
        } else if (token === '.') {
            //concatenation
            //pop the last 2 nfas
            nfaRight = nfaStack.pop();
            nfaLeft = nfaStack.pop();
            nfaStack.push(nfaLeft.concat_v3(nfaRight));
        } else if (token === '|') {
            //ORing
            //pop the last 2 nfas
            nfaRight = nfaStack.pop();
            nfaLeft = nfaStack.pop();
            nfaStack.push(nfaLeft.or(nfaRight));
        } else if (token === '*') {
            let nfa = nfaStack.pop();
            nfaStack.push(nfa.star());
        }
    }

    let nfa = nfaStack.pop();
    return nfa;

}

/**
 * Converts the nfa state to the lab required json format
 * @function 
 * @param {NFA} nfa 
 * @returns {object} 
 */
const parseToRequiredFormat = (nfa) => {
    
    const parseStates = (arr) => {
        return arr.map(e => "S"+e);
    }

    let jsonObj = {};
    jsonObj["startingState"] = "S"+nfa.startState;
    const terminatingStates = nfa.endState;
    for (state of nfa.transitions) {
        let tmpbj = {
            ["S"+state.startState]: {
                "isTerminatingState": state.startState === nfa.endState[0] ? true : false,
                [state.input === 'ε' ? "Epsilon" : state.input]: parseStates(state.endState)
            }
        };
        jsonObj = {...jsonObj, ...tmpbj};
    }

    for (state of nfa.endState) {
        let tmpObj = {
            ["S"+state]: {
                "isTerminating": true
            }
        };
        jsonObj = {...jsonObj, ...tmpObj};
    }

    return jsonObj;


}

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
   
  readline.question('Enter regular expression: ', regularExpression => {
    console.log(`You entered ${regularExpression}\n`);
    
    const regExp = regularExpression;//"a(b|c)d";

    try {
        const newRegExp = convertToPostfix(regExp);
        const nfa = convertToNFA(newRegExp);
        
        const parsedOutput = parseToRequiredFormat(nfa);
        console.log(parsedOutput);
        
        fs.writeFile('nfa.json', JSON.stringify(parsedOutput), (err) => {
          if (err) throw err;
          console.log('\nFile saved to nfa.json\n');
        });
    
    } catch (err) {
        console.log("regular expression is not valid");
    }
    readline.close();
  });



