// Updated clanmission.js to beautify responses

const operators = [
    {name: 'Operator1', value: '1'},
    {name: 'Operator2', value: '2'},
    // ... other operators
];

function getOperators() {
    return operators.map(operator => operator.name).join(', ');
}

// Other existing functions

