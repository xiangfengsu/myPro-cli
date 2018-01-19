const program = require('commander');
const chalk = require('chalk');
const pkg = require('../package.json');

const newCli = require('../lib/new');
const generateCli = require('../lib/generate');
const prettierCli = require('../lib/prettier');

program.version(pkg.version)
  .option('init', '`pro init` is deprecated, please use `pro new`')
  .option('new', 'new a Ant Design Pro project.')
  .option('new --no-auto-install', 'new a Ant Design Pro project.')
  .option('generate', 'generate template')
  .option('prettier', 'format code by prettier eslint')
  .option('n', 'new a Ant Design Pro project.')
  .option('n --no-auto-install', 'new a Ant Design Pro project.')
  .option('g', 'generate template')
  .option('p', 'format code by prettier eslint')
  .parse(process.argv);

if (program.init) {
  console.log(chalk.red('`pro init` is deprecated, please use `pro new`'));
}

if (program.new || program.n) {
  newCli(process.argv);
}

if (program.generate || program.g) {
  generateCli(process.argv);
}

if (program.prettier || program.p) {
  prettierCli(process.argv);
}