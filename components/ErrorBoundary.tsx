import { logger } from "@/utils/logger";
import React, { Component, ErrorInfo, ReactNode } from "react";
import { Pressable, Text, View } from "react-native";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        logger.error("Uncaught error in ErrorBoundary", error, {
            componentStack: errorInfo.componentStack ?? undefined,
        });
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <View className="flex-1 justify-center items-center bg-white px-6">
                    <Text className="text-2xl font-bold text-gray-900 mb-2">
                        Something went wrong
                    </Text>
                    <Text className="text-gray-500 text-center mb-6">
                        The app ran into an unexpected error. Please try again.
                    </Text>
                    {__DEV__ && this.state.error && (
                        <View className="bg-red-50 rounded-xl p-4 mb-6 w-full">
                            <Text className="text-red-700 font-mono text-xs">
                                {this.state.error.message}
                            </Text>
                        </View>
                    )}
                    <Pressable
                        onPress={this.handleReset}
                        className="bg-primary px-8 py-3 rounded-xl"
                    >
                        <Text className="text-white font-bold text-base">
                            Try Again
                        </Text>
                    </Pressable>
                </View>
            );
        }

        return this.props.children;
    }
}
