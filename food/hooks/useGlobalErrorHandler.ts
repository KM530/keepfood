import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useErrorHandler } from '@/contexts/ErrorContext';

export function useGlobalErrorHandler() {
	const { addError } = useErrorHandler();

	useEffect(() => {
		if (Platform.OS === 'web') {
			const handleError = (event: ErrorEvent) => {
				addError(event.error || new Error(event.message), undefined, {
					screen: window.location.pathname,
					action: 'runtime_error',
				});
				event.preventDefault();
			};
			const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
				const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
				addError(error, undefined, {
					screen: window.location.pathname,
					action: 'unhandled_promise_rejection',
				});
				event.preventDefault();
			};
			window.addEventListener('error', handleError);
			window.addEventListener('unhandledrejection', handleUnhandledRejection);
			return () => {
				window.removeEventListener('error', handleError);
				window.removeEventListener('unhandledrejection', handleUnhandledRejection);
			};
		}
		return undefined;
	}, [addError]);

	useEffect(() => {
		if (Platform.OS !== 'web') {
			const globalAny: any = global;
			const defaultHandler = globalAny.ErrorUtils && globalAny.ErrorUtils.getGlobalHandler && globalAny.ErrorUtils.getGlobalHandler();
			if (globalAny.ErrorUtils && globalAny.ErrorUtils.setGlobalHandler) {
				globalAny.ErrorUtils.setGlobalHandler((error: Error, isFatal?: boolean) => {
					addError(error, undefined, { action: isFatal ? 'fatal' : 'non_fatal' });
					if (defaultHandler) {
						defaultHandler(error, isFatal);
					}
				});
			}

			const originalConsoleError = console.error;
			console.error = (...args) => {
				originalConsoleError.apply(console, args as any);
				const errArg = args.find(arg => arg instanceof Error);
				if (errArg) {
					addError(errArg as Error, undefined, { action: 'console_error' });
				}
			};
			return () => {
				console.error = originalConsoleError;
			};
		}
		return undefined;
	}, [addError]);
}
