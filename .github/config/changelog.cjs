module.exports = {
  types: [
    { types: ['feat', 'feature'], label: '🎉 Nouvelle fonctionalité' },
    { types: ['fix', 'bugfix'], label: '🐛 Réparation de bug' },
    { types: ['improvements', 'enhancement'], label: '🔨 Amélioration' },
    { types: ['build', 'ci'], label: '🏗️ Déploiement' },
    { types: ['refactor'], label: '🪚 Réamenagement de code' },
    { types: ['perf'], label: '🏎️ Amélioration de performance' },
    { types: ['doc', 'docs'], label: '📚 Changement de documentation' },
    { types: ['test', 'tests'], label: '🔍 Tests' },
    { types: ['style'], label: '💅 Style de code' },
    { types: ['chore'], label: '🧹 Nettoyage' },
    { types: ['other'], label: 'Autres changements' },
  ],

  excludeTypes: ['other', 'perf', 'test', 'tests', 'style', 'chore', 'doc', 'docs'],
};