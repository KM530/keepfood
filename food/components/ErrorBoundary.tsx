import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';

interface Props {
	children: React.ReactNode;
	fallback?: React.ReactNode;
	onError?: (error: Error, componentStack?: string) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
	constructor(props: Props) {
		super(props);
		this.state = {
			hasError: false,
			error: null,
			errorInfo: null,
		};
	}

	static getDerivedStateFromError(error: Error): State {
		return {
			hasError: true,
			error,
			errorInfo: null,
		};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error('ErrorBoundary caught an error:', error, errorInfo);
		console.group('🚨 Error Boundary Error');
		console.error('Error:', error);
		console.error('Error Info:', errorInfo);
		console.error('Component Stack:', errorInfo.componentStack);
		console.groupEnd();

		this.setState({
			error,
			errorInfo,
		});

		// 调用外部 onError 回调
		if (this.props.onError) {
			this.props.onError(error, errorInfo.componentStack || undefined);
		}

		this.reportError(error, errorInfo);
	}

	private reportError = (error: Error, errorInfo: React.ErrorInfo) => {
		try {
			console.log('Error reported to monitoring service');
		} catch (reportError) {
			console.error('Failed to report error:', reportError);
		}
	};

	private handleRetry = () => {
		this.setState({
			hasError: false,
			error: null,
			errorInfo: null,
		});
	};

	private handleRestart = () => {
		if (typeof window !== 'undefined') {
			window.location.reload();
		} else {
			this.setState({
				hasError: false,
				error: null,
				errorInfo: null,
			});
		}
	};

	render() {
		if (this.state.hasError) {
			return (
				<View style={styles.errorContainer}>
					<View style={styles.errorContent}>
						<Ionicons name="warning" size={64} color="#FF6B6B" />
						<Text style={styles.errorTitle}>应用遇到问题</Text>
						<Text style={styles.errorMessage}>
							{this.state.error?.message || '发生了未知错误'}
						</Text>
						
						{__DEV__ && this.state.errorInfo && (
							<View style={styles.errorDetails}>
								<Text style={styles.errorDetailsTitle}>错误详情 (开发模式):</Text>
								<Text style={styles.errorStack}>
									{this.state.errorInfo.componentStack}
								</Text>
							</View>
						)}
						
						<View style={styles.errorActions}>
							<TouchableOpacity
								style={[styles.errorButton, styles.retryButton]}
								onPress={this.handleRetry}
							>
								<Text style={styles.retryButtonText}>重试</Text>
							</TouchableOpacity>
							
							<TouchableOpacity
								style={[styles.errorButton, styles.restartButton]}
								onPress={this.handleRestart}
							>
								<Text style={styles.restartButtonText}>重启应用</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			);
		}

		return this.props.children;
	}
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: Colors.light.background,
	},
	scrollContainer: {
		flexGrow: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
	},
	errorContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		padding: 20,
		backgroundColor: Colors.light.background,
	},
	errorContent: {
		alignItems: 'center',
		maxWidth: 400,
		width: '100%',
		padding: 20,
		backgroundColor: 'white',
		borderRadius: 10,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	errorIcon: {
		fontSize: 64,
		marginBottom: 20,
	},
	errorTitle: {
		fontSize: 24,
		fontWeight: 'bold',
		marginBottom: 16,
		textAlign: 'center',
		color: '#333',
	},
	errorMessage: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 24,
		color: '#666',
	},
	devInfo: {
		width: '100%',
		marginBottom: 32,
		padding: 16,
		backgroundColor: '#f5f5f5',
		borderRadius: 8,
	},
	devTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
	},
	errorText: {
		fontSize: 12,
		color: '#d32f2f',
		marginBottom: 8,
		fontFamily: 'monospace',
	},
	stackText: {
		fontSize: 10,
		color: '#666',
		fontFamily: 'monospace',
	},
	buttonContainer: {
		flexDirection: 'row',
		gap: 16,
	},
	retryButton: {
		backgroundColor: Colors.light.tint,
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	restartButton: {
		backgroundColor: '#666',
		paddingHorizontal: 24,
		paddingVertical: 12,
		borderRadius: 8,
	},
	buttonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	errorDetails: {
		width: '100%',
		marginTop: 20,
		padding: 10,
		backgroundColor: '#f9f9f9',
		borderRadius: 5,
		borderWidth: 1,
		borderColor: '#eee',
	},
	errorDetailsTitle: {
		fontSize: 14,
		fontWeight: 'bold',
		marginBottom: 8,
		color: '#555',
	},
	errorStack: {
		fontSize: 12,
		color: '#333',
		fontFamily: 'monospace',
	},
	errorActions: {
		flexDirection: 'row',
		gap: 15,
		marginTop: 20,
	},
	errorButton: {
		flex: 1,
		paddingVertical: 10,
		paddingHorizontal: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	retryButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
	restartButtonText: {
		color: 'white',
		fontSize: 16,
		fontWeight: '600',
	},
});
