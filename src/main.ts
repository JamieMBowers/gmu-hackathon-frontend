import { createApp } from 'vue';
import App from './App.vue';

import 'vuetify/styles';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import '@mdi/font/css/materialdesignicons.css';

import './style.css';

const vuetify = createVuetify({
	components,
	directives,
	theme: {
		defaultTheme: 'gmuLight',
		themes: {
			gmuLight: {
				colors: {
					// GMU green & gold inspired palette
					primary: '#006633',
					secondary: '#FFCC33',
					accent: '#004221',
					background: '#F5F5F5',
					surface: '#FFFFFF',
					info: '#2563EB',
					success: '#16A34A',
					warning: '#F59E0B',
					error: '#B91C1C',
				},
			},
		},
	},
});

createApp(App).use(vuetify).mount('#app');
