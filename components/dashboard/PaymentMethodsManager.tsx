"use client"

import { useState, useEffect } from "react"
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Divider, Chip } from "@heroui/react"
import { CreditCard, Building2, Plus, Trash2, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/hooks/use-auth"
import { 
    getUserPaymentMethods, 
    createUserPaymentMethod, 
    updateUserPaymentMethod, 
    deleteUserPaymentMethod,
    getUserActivePaymentMethod,
    type UserPaymentMethod 
} from "@/integrations/strapi/paymentMethod"

export function PaymentMethodsManager() {
    const { user } = useAuth()
    const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethod[]>([])
    const [loading, setLoading] = useState(true)
    const [isAdding, setIsAdding] = useState(false)
    const [showAddForm, setShowAddForm] = useState(false)
    const [activeMethod, setActiveMethod] = useState<UserPaymentMethod | null>(null)

    // Form state
    const [formData, setFormData] = useState({
        type: 'aba_bank' as UserPaymentMethod['type'],
        provider: 'aba_payway' as UserPaymentMethod['provider'],
        account_number: '',
        account_name: '',
        bank_name: 'ABA Bank',
        bank_swift_bic: '',
        bank_country: 'Cambodia',
    })

    useEffect(() => {
        if (user?.id) {
            loadPaymentMethods()
        }
    }, [user?.id])

    const loadPaymentMethods = async () => {
        if (!user?.id) return
        try {
            setLoading(true)
            const methods = await getUserPaymentMethods(user.id.toString())
            setPaymentMethods(methods)
            
            // Get active method
            const active = await getUserActivePaymentMethod(user.id.toString())
            setActiveMethod(active)
        } catch (error) {
            console.error("Error loading payment methods:", error)
            toast.error("Failed to load payment methods")
        } finally {
            setLoading(false)
        }
    }

    const handleAddPaymentMethod = async () => {
        if (!user?.id) {
            toast.error("Please login to add payment methods")
            return
        }

        // Validation
        if (!formData.account_number || !formData.account_name) {
            toast.error("Please fill in account number and account name")
            return
        }

        try {
            setIsAdding(true)
            const newMethod = await createUserPaymentMethod(user.id.toString(), {
                type: formData.type,
                provider: formData.provider,
                details: {
                    account_number: formData.account_number,
                    account_name: formData.account_name,
                    bank_name: formData.bank_name,
                    bank_swift_bic: formData.bank_swift_bic,
                    bank_country: formData.bank_country,
                    aba_account_number: formData.account_number,
                    aba_account_name: formData.account_name,
                },
                default: false,
                active: true, // Set as active (will deactivate others)
            })

            if (newMethod) {
                toast.success("Payment method added successfully")
                setShowAddForm(false)
                setFormData({
                    type: 'aba_bank',
                    provider: 'aba_payway',
                    account_number: '',
                    account_name: '',
                    bank_name: 'ABA Bank',
                    bank_swift_bic: '',
                    bank_country: 'Cambodia',
                })
                await loadPaymentMethods()
            } else {
                toast.error("Failed to add payment method")
            }
        } catch (error: any) {
            console.error("Error adding payment method:", error)
            toast.error(error.message || "Failed to add payment method")
        } finally {
            setIsAdding(false)
        }
    }

    const handleSetActive = async (method: UserPaymentMethod) => {
        if (!user?.id) return
        
        try {
            const updated = await updateUserPaymentMethod(method.documentId, {
                active: true,
                user: user.id.toString(),
            })

            if (updated) {
                toast.success("Payment method activated")
                await loadPaymentMethods()
            } else {
                toast.error("Failed to activate payment method")
            }
        } catch (error) {
            console.error("Error activating payment method:", error)
            toast.error("Failed to activate payment method")
        }
    }

    const handleDelete = async (method: UserPaymentMethod) => {
        if (!confirm(`Are you sure you want to delete this payment method?`)) {
            return
        }

        try {
            const deleted = await deleteUserPaymentMethod(method.documentId)
            if (deleted) {
                toast.success("Payment method deleted")
                await loadPaymentMethods()
            } else {
                toast.error("Failed to delete payment method")
            }
        } catch (error) {
            console.error("Error deleting payment method:", error)
            toast.error("Failed to delete payment method")
        }
    }

    if (loading) {
        return (
            <Card>
                <CardBody className="p-8">
                    <div className="flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    </div>
                </CardBody>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-blue-500" />
                        <div>
                            <h3 className="text-xl font-bold">Payment Methods</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Manage your payment methods for receiving payouts
                            </p>
                        </div>
                    </div>
                    {!showAddForm && (
                        <Button
                            color="primary"
                            startContent={<Plus className="w-4 h-4" />}
                            onPress={() => setShowAddForm(true)}
                        >
                            Add Payment Method
                        </Button>
                    )}
                </CardHeader>
                <CardBody className="space-y-4">
                    {/* Add Form */}
                    {showAddForm && (
                        <Card className="border-2 border-blue-200 dark:border-blue-800">
                            <CardHeader>
                                <h4 className="font-semibold">Add ABA Bank Account</h4>
                            </CardHeader>
                            <CardBody className="space-y-4">
                                <Input
                                    label="Account Number"
                                    placeholder="Enter ABA account number"
                                    value={formData.account_number}
                                    onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Account Name"
                                    placeholder="Enter account holder name"
                                    value={formData.account_name}
                                    onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Bank Name"
                                    value={formData.bank_name}
                                    disabled
                                />
                                <Input
                                    label="SWIFT/BIC Code (Optional)"
                                    placeholder="Enter SWIFT/BIC code"
                                    value={formData.bank_swift_bic}
                                    onChange={(e) => setFormData({ ...formData, bank_swift_bic: e.target.value })}
                                />
                                <Input
                                    label="Country"
                                    value={formData.bank_country}
                                    disabled
                                />
                                <div className="flex gap-2">
                                    <Button
                                        color="primary"
                                        onPress={handleAddPaymentMethod}
                                        isLoading={isAdding}
                                        className="flex-1"
                                    >
                                        Add Payment Method
                                    </Button>
                                    <Button
                                        variant="flat"
                                        onPress={() => {
                                            setShowAddForm(false)
                                            setFormData({
                                                type: 'aba_bank',
                                                provider: 'aba_payway',
                                                account_number: '',
                                                account_name: '',
                                                bank_name: 'ABA Bank',
                                                bank_swift_bic: '',
                                                bank_country: 'Cambodia',
                                            })
                                        }}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    {/* Payment Methods List */}
                    {paymentMethods.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No payment methods added yet</p>
                            <p className="text-sm">Add a payment method to receive payouts</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {paymentMethods.map((method) => (
                                <Card
                                    key={method.documentId}
                                    className={`border-2 ${
                                        method.active
                                            ? 'border-green-500 dark:border-green-600 bg-green-50 dark:bg-green-950/20'
                                            : 'border-slate-200 dark:border-slate-700'
                                    }`}
                                >
                                    <CardBody className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                                                    <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-semibold">
                                                            {method.details?.account_name || 'Bank Account'}
                                                        </span>
                                                        {method.active && (
                                                            <Chip
                                                                color="success"
                                                                size="sm"
                                                                startContent={<CheckCircle className="w-3 h-3" />}
                                                            >
                                                                Active
                                                            </Chip>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400">
                                                        {method.details?.bank_name || 'ABA Bank'}
                                                    </p>
                                                    <p className="text-xs text-slate-500 mt-1">
                                                        Account: •••• {method.details?.account_number?.slice(-4) || ''}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!method.active && (
                                                    <Button
                                                        size="sm"
                                                        variant="flat"
                                                        color="success"
                                                        onPress={() => handleSetActive(method)}
                                                    >
                                                        Set Active
                                                    </Button>
                                                )}
                                                <Button
                                                    size="sm"
                                                    variant="light"
                                                    color="danger"
                                                    isIconOnly
                                                    onPress={() => handleDelete(method)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardBody>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Info Message */}
                    {paymentMethods.length > 0 && (
                        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <strong>Note:</strong> Only one payment method can be active at a time. 
                                When you activate a new payment method, the previous one will be automatically deactivated.
                            </p>
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    )
}

