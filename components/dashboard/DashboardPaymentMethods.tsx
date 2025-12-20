"use client"

import React, { useState, useEffect } from "react"
import { Card, CardBody, CardHeader, Button, Input, Select, SelectItem, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Chip } from "@heroui/react"
import { CreditCard, Building2, Plus, Trash2, CheckCircle, XCircle, Edit2 } from "lucide-react"
import { toast } from "sonner"
import { getUserPaymentMethods, createUserPaymentMethod, updateUserPaymentMethod, deleteUserPaymentMethod, UserPaymentMethod } from "@/integrations/strapi/paymentMethod"
import { useAuth } from "@/hooks/use-auth"

export function DashboardPaymentMethods() {
  const { user } = useAuth()
  const [paymentMethods, setPaymentMethods] = useState<UserPaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [editingMethod, setEditingMethod] = useState<UserPaymentMethod | null>(null)
  const [formData, setFormData] = useState({
    type: 'bank_account' as 'bank_account' | 'credit_card' | 'debit_card' | 'paypal',
    provider: 'manual' as 'stripe' | 'paypal' | 'manual',
    account_number: '',
    account_name: '',
    bank_name: '',
    bank_swift_bic: '',
    bank_country: 'Cambodia',
    default: false,
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
      const methods = await getUserPaymentMethods(user.id)
      setPaymentMethods(methods)
    } catch (error) {
      console.error("Error loading payment methods:", error)
      toast.error("Failed to load payment methods")
    } finally {
      setLoading(false)
    }
  }

  const handleOpenAdd = () => {
    setEditingMethod(null)
    setFormData({
      type: 'bank_account',
      provider: 'manual',
      account_number: '',
      account_name: '',
      bank_name: '',
      bank_swift_bic: '',
      bank_country: 'Cambodia',
      default: false,
    })
    onOpen()
  }

  const handleClose = () => {
    onClose()
    // Reset form after a short delay to allow modal close animation
    setTimeout(() => {
      setEditingMethod(null)
      setFormData({
        type: 'bank_account',
        provider: 'manual',
        account_number: '',
        account_name: '',
        bank_name: '',
        bank_swift_bic: '',
        bank_country: 'Cambodia',
        default: false,
      })
    }, 300)
  }

  const handleOpenEdit = (method: UserPaymentMethod) => {
    setEditingMethod(method)
    setFormData({
      type: method.type,
      provider: method.provider,
      account_number: method.details?.account_number || method.details?.aba_account_number || '',
      account_name: method.details?.account_name || '',
      bank_name: method.details?.bank_name || '',
      bank_swift_bic: method.details?.bank_swift_bic || '',
      bank_country: method.details?.bank_country || 'Cambodia',
      default: method.default,
    })
    onOpen()
  }

  const handleSubmit = async () => {
    if (!user?.id) return

    // Validate based on payment type
    if (formData.type === 'bank_account') {
      if (!formData.account_number || !formData.account_name || !formData.bank_name || !formData.bank_country) {
        toast.error("Please fill in all required fields for bank account")
        return
      }
    } else if (formData.type === 'paypal') {
      if (!formData.account_number || !formData.account_number.includes('@')) {
        toast.error("Please enter a valid PayPal email address")
        return
      }
    } else if (formData.type === 'credit_card' || formData.type === 'debit_card') {
      toast.error("Credit/Debit cards must be added through Stripe payment flow. Please use the checkout page to add a card.")
      return
    }

    try {
      setSaving(true)

      const details: any = {}
      
      if (formData.type === 'bank_account') {
        details.account_number = formData.account_number
        details.account_name = formData.account_name
        details.bank_name = formData.bank_name
        details.bank_swift_bic = formData.bank_swift_bic
        details.bank_country = formData.bank_country
      } else if (formData.type === 'paypal') {
        details.paypal_email = formData.account_number // Reuse account_number field for email
      }

      if (editingMethod) {
        // Update existing
        const updated = await updateUserPaymentMethod(editingMethod.documentId, {
          type: formData.type,
          provider: formData.provider,
          details,
          default: formData.default,
          active: true, // Keep active for backward compatibility, but use default for logic
        })
        if (updated) {
          toast.success("Payment method updated successfully")
          await loadPaymentMethods()
          handleClose()
        } else {
          toast.error("Failed to update payment method")
        }
      } else {
        // Create new
        const created = await createUserPaymentMethod(user.id, {
          type: formData.type,
          provider: formData.provider,
          details,
          default: formData.default,
          active: true, // Keep active for backward compatibility, but use default for logic
        })
        if (created) {
          toast.success("Payment method added successfully")
          await loadPaymentMethods()
          handleClose()
        } else {
          toast.error("Failed to add payment method")
        }
      }
    } catch (error: any) {
      console.error("Error saving payment method:", error)
      toast.error(error.message || "Failed to save payment method")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (method: UserPaymentMethod) => {
    if (!confirm(`Are you sure you want to delete this payment method?`)) return

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

  const handleToggleDefault = async (method: UserPaymentMethod) => {
    try {
      const updated = await updateUserPaymentMethod(method.documentId, {
        default: !method.default,
        user: method.user,
      })
      if (updated) {
        toast.success(`Payment method ${!method.default ? 'set as default' : 'removed as default'}`)
        await loadPaymentMethods()
      } else {
        toast.error("Failed to update payment method")
      }
    } catch (error) {
      console.error("Error toggling default payment method:", error)
      toast.error("Failed to update payment method")
    }
  }

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'bank_account':
        return <Building2 className="w-5 h-5" />
      case 'credit_card':
      case 'debit_card':
        return <CreditCard className="w-5 h-5" />
      case 'paypal':
        return <CreditCard className="w-5 h-5" />
      default:
        return <CreditCard className="w-5 h-5" />
    }
  }

  const getMethodLabel = (method: UserPaymentMethod) => {
    if (method.type === 'bank_account') {
      const bankName = method.details?.bank_name || 'Bank'
      const accountNumber = method.details?.account_number || 'N/A'
      return `${bankName} - ${accountNumber}`
    }
    if (method.type === 'credit_card' || method.type === 'debit_card') {
      return `${method.type.replace('_', ' ').toUpperCase()} - ${method.details?.last4 || 'N/A'}`
    }
    if (method.type === 'paypal') {
      return `PayPal - ${method.details?.paypal_email || 'N/A'}`
    }
    return `${method.type.replace('_', ' ').toUpperCase()} - N/A`
  }

  if (loading) {
    return (
      <Card>
        <CardBody>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Methods</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage your payment methods. Only one method can be set as default at a time.
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Plus className="w-4 h-4" />}
          onPress={handleOpenAdd}
        >
          Add Payment Method
        </Button>
      </div>

      {paymentMethods.length === 0 ? (
        <Card>
          <CardBody className="text-center py-12">
            <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No payment methods added yet
            </p>
            <Button color="primary" onPress={handleOpenAdd}>
              Add Your First Payment Method
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.documentId} className={method.default ? "border-2 border-blue-500" : ""}>
              <CardHeader className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getMethodIcon(method.type)}
                  <div>
                    <p className="font-semibold">{getMethodLabel(method)}</p>
                    <p className="text-sm text-slate-500">
                      {method.details?.account_name || 'N/A'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.default ? (
                    <Chip color="success" size="sm" variant="flat">
                      Default
                    </Chip>
                  ) : (
                    <Chip color="default" size="sm" variant="flat">
                      Not Default
                    </Chip>
                  )}
                </div>
              </CardHeader>
              <CardBody>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Type:</span>
                    <span className="font-medium">{method.type.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Provider:</span>
                    <span className="font-medium">{method.provider.replace('_', ' ').toUpperCase()}</span>
                  </div>
                  {method.details?.bank_name && (
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Bank:</span>
                      <span className="font-medium">{method.details.bank_name}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={method.default ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                    onPress={() => handleToggleDefault(method)}
                  >
                    {method.default ? 'Remove Default' : 'Set as Default'}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    startContent={<Edit2 className="w-4 h-4" />}
                    onPress={() => handleOpenEdit(method)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    color="danger"
                    variant="flat"
                    startContent={<Trash2 className="w-4 h-4" />}
                    onPress={() => handleDelete(method)}
                  >
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isOpen} onClose={handleClose} size="2xl">
        <ModalContent>
          <ModalHeader>
            {editingMethod ? 'Edit Payment Method' : 'Add Payment Method'}
          </ModalHeader>
          <ModalBody>
            <div className="space-y-4">
              <Select
                label="Payment Type"
                selectedKeys={[formData.type]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string
                  // Auto-set provider based on type and reset form fields
                  let autoProvider: 'stripe' | 'paypal' | 'manual' = 'manual'
                  if (selected === 'paypal') {
                    autoProvider = 'paypal'
                  } else if (selected === 'credit_card' || selected === 'debit_card') {
                    autoProvider = 'stripe'
                  } else {
                    autoProvider = 'manual'
                  }
                  
                  setFormData(prev => ({
                    ...prev,
                    type: selected as any,
                    provider: autoProvider,
                    // Reset fields when type changes
                    account_number: '',
                    account_name: '',
                    bank_name: selected === 'bank_account' ? '' : prev.bank_name,
                    bank_swift_bic: '',
                    bank_country: selected === 'bank_account' ? 'Cambodia' : prev.bank_country,
                  }))
                }}
              >
                <SelectItem key="bank_account" value="bank_account">Bank Account</SelectItem>
                <SelectItem key="credit_card" value="credit_card">Credit Card</SelectItem>
                <SelectItem key="debit_card" value="debit_card">Debit Card</SelectItem>
                <SelectItem key="paypal" value="paypal">PayPal</SelectItem>
              </Select>

              {/* Provider - Auto-set based on type, but allow manual override for bank_account */}
              {formData.type === 'bank_account' ? (
                <Select
                  label="Provider"
                  selectedKeys={[formData.provider]}
                  onSelectionChange={(keys) => {
                    const selected = Array.from(keys)[0] as string
                    setFormData(prev => ({ ...prev, provider: selected as any }))
                  }}
                >
                  <SelectItem key="manual" value="manual">Manual</SelectItem>
                  <SelectItem key="stripe" value="stripe">Stripe</SelectItem>
                </Select>
              ) : (
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    <span className="font-semibold">Provider:</span> {formData.provider.charAt(0).toUpperCase() + formData.provider.slice(1)} (auto-selected)
                  </p>
                </div>
              )}

              {/* Bank Account Fields */}
              {formData.type === 'bank_account' && (
                <>
                  <Input
                    label="Bank Name"
                    placeholder="Enter bank name (e.g., ABA Bank)"
                    value={formData.bank_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                    isRequired
                  />

                  <Input
                    label="Account Number"
                    placeholder="Enter account number"
                    value={formData.account_number}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                    isRequired
                  />

                  <Input
                    label="Account Holder Name"
                    placeholder="Enter account holder name"
                    value={formData.account_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, account_name: e.target.value }))}
                    isRequired
                  />

                  <Input
                    label="SWIFT/BIC Code (Optional)"
                    placeholder="Enter SWIFT/BIC code"
                    value={formData.bank_swift_bic}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_swift_bic: e.target.value }))}
                  />

                  <Input
                    label="Country"
                    placeholder="Enter country"
                    value={formData.bank_country}
                    onChange={(e) => setFormData(prev => ({ ...prev, bank_country: e.target.value }))}
                    isRequired
                  />
                </>
              )}

              {/* PayPal Fields */}
              {formData.type === 'paypal' && (
                <Input
                  label="PayPal Email"
                  placeholder="Enter PayPal email address"
                  type="email"
                  value={formData.account_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                  isRequired
                />
              )}

              {/* Credit/Debit Card Info */}
              {(formData.type === 'credit_card' || formData.type === 'debit_card') && (
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-200 font-semibold mb-2">
                    ℹ️ Credit/Debit Card Information
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300">
                    Credit and debit cards are managed through Stripe. To add a card, complete a payment during checkout and your card will be saved automatically.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="default"
                  checked={formData.default}
                  onChange={(e) => setFormData(prev => ({ ...prev, default: e.target.checked }))}
                  className="w-4 h-4"
                />
                <label htmlFor="default" className="text-sm">
                  Set as default payment method (will unset others)
                </label>
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={handleClose} isDisabled={saving}>
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSubmit} 
              isLoading={saving}
            >
              {editingMethod ? 'Update' : 'Add'} Payment Method
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  )
}

