module.exports = {
	Platform: {
		OS: 'web',
		select: (spec) => spec?.web,
	},
	AppState: {
		currentState: 'active',
		addEventListener: () => ({
			remove: () => {},
		}),
	},
};