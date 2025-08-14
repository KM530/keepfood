import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import { Colors } from '@/constants/Colors';

interface Props {
	children: ReactNode;
	fallback?: ReactNode;
	onError?: (error: Error, componentStack?: string) => void;
}

interface State {
	hasError: boolean;
	error: Error | null;
	errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
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
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<ThemedView style={styles.container}>
					<ScrollView contentContainerStyle={styles.scrollContainer}>
						<View style={styles.errorContainer}>
							<Text style={styles.errorIcon}>🚨</Text>
							<ThemedText style={styles.errorTitle}>
								应用遇到问题
							</ThemedText>
							<ThemedText style={styles.errorMessage}>
								很抱歉，应用遇到了一个错误。请尝试重新启动应用。
							</ThemedText>
							{__DEV__ && this.state.error && (
								<View style={styles.devInfo}>
									<ThemedText style={styles.devTitle}>开发模式信息:</ThemedText>
									<Text style={styles.errorText}>
										{this.state.error.toString()}
									</Text>
									{this.state.errorInfo && (
										<Text style={styles.stackText}>
											{this.state.errorInfo.componentStack}
										</Text>
									)}
								</View>
							)}
							<View style={styles.buttonContainer}>
								<TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
									<Text style={styles.buttonText}>重试</Text>
								</TouchableOpacity>
								<TouchableOpacity style={styles.restartButton} onPress={this.handleRestart}>
									<Text style={styles.buttonText}>重启应用</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
				</ThemedView>
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
		alignItems: 'center',
		maxWidth: 400,
		width: '100%',
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
	},
	errorMessage: {
		fontSize: 16,
		textAlign: 'center',
		marginBottom: 32,
		lineHeight: 24,
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
});
