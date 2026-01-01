import { z } from "zod";
export declare const ScheduleItemCreateZod: z.ZodObject<{
    id: z.ZodString;
    quantity: z.ZodNumber;
    content: z.ZodEffects<z.ZodObject<{
        variant: z.ZodEnum<["custom", "food", "dish"]>;
        customName: z.ZodOptional<z.ZodString>;
        foodId: z.ZodOptional<z.ZodString>;
        dishId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }>, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }>;
    time: z.ZodString;
}, "strip", z.ZodTypeAny, {
    time?: string;
    id?: string;
    content?: {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    };
    quantity?: number;
}, {
    time?: string;
    id?: string;
    content?: {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    };
    quantity?: number;
}>;
export declare const ScheduleItemUpdateZod: z.ZodObject<{
    id: z.ZodString;
    quantity: z.ZodNumber;
    content: z.ZodEffects<z.ZodObject<{
        variant: z.ZodEnum<["custom", "food", "dish"]>;
        customName: z.ZodOptional<z.ZodString>;
        foodId: z.ZodOptional<z.ZodString>;
        dishId: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }>, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }, {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    }>;
    time: z.ZodString;
}, "strip", z.ZodTypeAny, {
    time?: string;
    id?: string;
    content?: {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    };
    quantity?: number;
}, {
    time?: string;
    id?: string;
    content?: {
        foodId?: string;
        dishId?: string;
        variant?: "custom" | "food" | "dish";
        customName?: string;
    };
    quantity?: number;
}>;
export declare const ScheduleItemsChangesZod: z.ZodObject<{
    create: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        quantity: z.ZodNumber;
        content: z.ZodEffects<z.ZodObject<{
            variant: z.ZodEnum<["custom", "food", "dish"]>;
            customName: z.ZodOptional<z.ZodString>;
            foodId: z.ZodOptional<z.ZodString>;
            dishId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }>, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }>;
        time: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }, {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }>, "many">>;
    update: z.ZodOptional<z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        quantity: z.ZodNumber;
        content: z.ZodEffects<z.ZodObject<{
            variant: z.ZodEnum<["custom", "food", "dish"]>;
            customName: z.ZodOptional<z.ZodString>;
            foodId: z.ZodOptional<z.ZodString>;
            dishId: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }>, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }, {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        }>;
        time: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }, {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }>, "many">>;
    delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    create?: {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }[];
    update?: {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }[];
    delete?: string[];
}, {
    create?: {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }[];
    update?: {
        time?: string;
        id?: string;
        content?: {
            foodId?: string;
            dishId?: string;
            variant?: "custom" | "food" | "dish";
            customName?: string;
        };
        quantity?: number;
    }[];
    delete?: string[];
}>;
export declare const ScheduleEventZod: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    value: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    value?: string;
    type?: string;
    id?: string;
}, {
    value?: string;
    type?: string;
    id?: string;
}>, {
    value?: string;
    type?: string;
    id?: string;
}, {
    value?: string;
    type?: string;
    id?: string;
}>;
export declare const ScheduleEventsChangesZod: z.ZodObject<{
    create: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: string;
        id?: string;
    }, {
        value?: string;
        type?: string;
        id?: string;
    }>, {
        value?: string;
        type?: string;
        id?: string;
    }, {
        value?: string;
        type?: string;
        id?: string;
    }>, "many">>;
    update: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        value: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        value?: string;
        type?: string;
        id?: string;
    }, {
        value?: string;
        type?: string;
        id?: string;
    }>, {
        value?: string;
        type?: string;
        id?: string;
    }, {
        value?: string;
        type?: string;
        id?: string;
    }>, "many">>;
    delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    create?: {
        value?: string;
        type?: string;
        id?: string;
    }[];
    update?: {
        value?: string;
        type?: string;
        id?: string;
    }[];
    delete?: string[];
}, {
    create?: {
        value?: string;
        type?: string;
        id?: string;
    }[];
    update?: {
        value?: string;
        type?: string;
        id?: string;
    }[];
    delete?: string[];
}>;
export declare const ScheduleZod: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodNumber;
    items: z.ZodObject<{
        create: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            quantity: z.ZodNumber;
            content: z.ZodEffects<z.ZodObject<{
                variant: z.ZodEnum<["custom", "food", "dish"]>;
                customName: z.ZodOptional<z.ZodString>;
                foodId: z.ZodOptional<z.ZodString>;
                dishId: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }>, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }>;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }, {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }>, "many">>;
        update: z.ZodOptional<z.ZodArray<z.ZodObject<{
            id: z.ZodString;
            quantity: z.ZodNumber;
            content: z.ZodEffects<z.ZodObject<{
                variant: z.ZodEnum<["custom", "food", "dish"]>;
                customName: z.ZodOptional<z.ZodString>;
                foodId: z.ZodOptional<z.ZodString>;
                dishId: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }>, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }, {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            }>;
            time: z.ZodString;
        }, "strip", z.ZodTypeAny, {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }, {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }>, "many">>;
        delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        create?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        update?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        delete?: string[];
    }, {
        create?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        update?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        delete?: string[];
    }>;
    events: z.ZodObject<{
        create: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            value: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            value?: string;
            type?: string;
            id?: string;
        }, {
            value?: string;
            type?: string;
            id?: string;
        }>, {
            value?: string;
            type?: string;
            id?: string;
        }, {
            value?: string;
            type?: string;
            id?: string;
        }>, "many">>;
        update: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
            id: z.ZodString;
            type: z.ZodString;
            value: z.ZodOptional<z.ZodString>;
        }, "strip", z.ZodTypeAny, {
            value?: string;
            type?: string;
            id?: string;
        }, {
            value?: string;
            type?: string;
            id?: string;
        }>, {
            value?: string;
            type?: string;
            id?: string;
        }, {
            value?: string;
            type?: string;
            id?: string;
        }>, "many">>;
        delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        create?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        update?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        delete?: string[];
    }, {
        create?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        update?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        delete?: string[];
    }>;
}, "strip", z.ZodTypeAny, {
    items?: {
        create?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        update?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        delete?: string[];
    };
    id?: string;
    userId?: number;
    events?: {
        create?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        update?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        delete?: string[];
    };
}, {
    items?: {
        create?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        update?: {
            time?: string;
            id?: string;
            content?: {
                foodId?: string;
                dishId?: string;
                variant?: "custom" | "food" | "dish";
                customName?: string;
            };
            quantity?: number;
        }[];
        delete?: string[];
    };
    id?: string;
    userId?: number;
    events?: {
        create?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        update?: {
            value?: string;
            type?: string;
            id?: string;
        }[];
        delete?: string[];
    };
}>;
export declare const ScheduleSyncInputZod: z.ZodObject<{
    schedules: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        userId: z.ZodNumber;
        items: z.ZodObject<{
            create: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                quantity: z.ZodNumber;
                content: z.ZodEffects<z.ZodObject<{
                    variant: z.ZodEnum<["custom", "food", "dish"]>;
                    customName: z.ZodOptional<z.ZodString>;
                    foodId: z.ZodOptional<z.ZodString>;
                    dishId: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }>, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }>;
                time: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }, {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }>, "many">>;
            update: z.ZodOptional<z.ZodArray<z.ZodObject<{
                id: z.ZodString;
                quantity: z.ZodNumber;
                content: z.ZodEffects<z.ZodObject<{
                    variant: z.ZodEnum<["custom", "food", "dish"]>;
                    customName: z.ZodOptional<z.ZodString>;
                    foodId: z.ZodOptional<z.ZodString>;
                    dishId: z.ZodOptional<z.ZodString>;
                }, "strip", z.ZodTypeAny, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }>, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }, {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                }>;
                time: z.ZodString;
            }, "strip", z.ZodTypeAny, {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }, {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }>, "many">>;
            delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            create?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            update?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            delete?: string[];
        }, {
            create?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            update?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            delete?: string[];
        }>;
        events: z.ZodObject<{
            create: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
                id: z.ZodString;
                type: z.ZodString;
                value: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                value?: string;
                type?: string;
                id?: string;
            }, {
                value?: string;
                type?: string;
                id?: string;
            }>, {
                value?: string;
                type?: string;
                id?: string;
            }, {
                value?: string;
                type?: string;
                id?: string;
            }>, "many">>;
            update: z.ZodOptional<z.ZodArray<z.ZodEffects<z.ZodObject<{
                id: z.ZodString;
                type: z.ZodString;
                value: z.ZodOptional<z.ZodString>;
            }, "strip", z.ZodTypeAny, {
                value?: string;
                type?: string;
                id?: string;
            }, {
                value?: string;
                type?: string;
                id?: string;
            }>, {
                value?: string;
                type?: string;
                id?: string;
            }, {
                value?: string;
                type?: string;
                id?: string;
            }>, "many">>;
            delete: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
        }, "strip", z.ZodTypeAny, {
            create?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            update?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            delete?: string[];
        }, {
            create?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            update?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            delete?: string[];
        }>;
    }, "strip", z.ZodTypeAny, {
        items?: {
            create?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            update?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            delete?: string[];
        };
        id?: string;
        userId?: number;
        events?: {
            create?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            update?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            delete?: string[];
        };
    }, {
        items?: {
            create?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            update?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            delete?: string[];
        };
        id?: string;
        userId?: number;
        events?: {
            create?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            update?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            delete?: string[];
        };
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    schedules?: {
        items?: {
            create?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            update?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            delete?: string[];
        };
        id?: string;
        userId?: number;
        events?: {
            create?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            update?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            delete?: string[];
        };
    }[];
}, {
    schedules?: {
        items?: {
            create?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            update?: {
                time?: string;
                id?: string;
                content?: {
                    foodId?: string;
                    dishId?: string;
                    variant?: "custom" | "food" | "dish";
                    customName?: string;
                };
                quantity?: number;
            }[];
            delete?: string[];
        };
        id?: string;
        userId?: number;
        events?: {
            create?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            update?: {
                value?: string;
                type?: string;
                id?: string;
            }[];
            delete?: string[];
        };
    }[];
}>;
export type ScheduleSyncInput = z.infer<typeof ScheduleSyncInputZod>;
export type ScheduleItemsChangesZodInput = z.infer<typeof ScheduleItemsChangesZod>;
export type ScheduleZodType = z.infer<typeof ScheduleZod>;
//# sourceMappingURL=validationV3.d.ts.map