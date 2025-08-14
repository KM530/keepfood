import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useErrorHandler } from '@/contexts/ErrorContext';

export default function ErrorOverlay() {
	const { errors, clearError, clearErrors, hasErrors } = useErrorHandler();
	if (!hasErrors) return null;

	const latest = errors[errors.length - 1];

	return (
		<View style={styles.overlay} pointerEvents="box-none">
			<View style={styles.card}>
				<Text style={styles.title}>检测到错误</Text>
				<ScrollView style={styles.scroll}>
					<Text style={styles.message}>{latest.error?.message || String(latest.error)}</Text>
					{latest.componentStack ? (
						<Text style={styles.stack}>{latest.componentStack}</Text>
					) : null}
				</ScrollView>
				<View style={styles.actions}>
					<TouchableOpacity style={[styles.button, styles.primary]} onPress={() => clearError(latest.id)}>
						<Text style={styles.buttonText}>关闭</Text>
					</TouchableOpacity>
					<TouchableOpacity style={[styles.button]} onPress={clearErrors}>
						<Text style={styles.buttonText}>清除全部</Text>
					</TouchableOpacity>
				</View>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	overlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'rgba(0,0,0,0.2)',
		zIndex: 9999,
	},
	card: {
		maxWidth: 480,
		width: '90%',
		maxHeight: '70%',
		backgroundColor: '#fff',
		borderRadius: 12,
		padding: 16,
		shadowColor: '#000',
		shadowOpacity: 0.2,
		shadowOffset: { width: 0, height: 6 },
		shadowRadius: 10,
		elevation: 10,
	},
	title: {
		fontSize: 18,
		fontWeight: '700',
		marginBottom: 8,
	},
	scroll: {
		maxHeight: 260,
		marginBottom: 12,
	},
	message: {
		fontSize: 14,
		color: '#d32f2f',
		marginBottom: 8,
	},
	stack: {
		fontSize: 12,
		color: '#666',
		fontFamily: 'monospace',
	},
	actions: {
		flexDirection: 'row',
		justifyContent: 'flex-end',
		gap: 12,
	},
	button: {
		paddingHorizontal: 16,
		paddingVertical: 10,
		borderRadius: 8,
		backgroundColor: '#888',
	},
	primary: {
		backgroundColor: '#0ea5e9',
	},
	buttonText: {
		color: '#fff',
		fontWeight: '600',
	},
});
