import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_strings.dart';
import '../../../shared/widgets/custom_button.dart';
import '../providers/patients_provider.dart';

class AddPatientScreen extends ConsumerStatefulWidget {
  const AddPatientScreen({super.key});

  @override
  ConsumerState<AddPatientScreen> createState() => _AddPatientScreenState();
}

class _AddPatientScreenState extends ConsumerState<AddPatientScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _hasInsurance = false;
  int _currentStep = 0;

  // Controllers
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _ageController = TextEditingController();
  final _procedureController = TextEditingController();
  final _medicalHistoryController = TextEditingController();
  final _notesController = TextEditingController();
  final _insuranceProviderController = TextEditingController();

  // Dropdowns
  String? _selectedGender;
  String? _selectedSpecialty;
  String? _selectedCity;
  String? _selectedBudget;
  String? _selectedUrgency;

  final _specialties = [
    'Ortho', 'Urology', 'Proctology', 'Cardiology',
    'ENT', 'General Surgery', 'Gynecology', 'Ophthalmology',
    'Neurology', 'Oncology',
  ];

  final _cities = [
    'Hyderabad', 'Bangalore', 'Mumbai', 'Delhi', 'Chennai',
    'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Surat',
  ];

  final _budgets = [
    'Below 50k', '50k-1L', '1L-2L', 'Above 2L',
  ];

  final _urgencies = [
    'Immediate', 'Within a week', 'Within a month', 'Flexible',
  ];

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _ageController.dispose();
    _procedureController.dispose();
    _medicalHistoryController.dispose();
    _notesController.dispose();
    _insuranceProviderController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Submit Lead', style: TextStyle(fontFamily: 'Poppins')),
        content: Text(
          'Submit lead for ${_nameController.text.trim()}?\n\nOur team will contact them within 24 hours.',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Submit')),
        ],
      ),
    );

    if (confirmed != true) return;

    setState(() => _isLoading = true);

    final formData = {
      'patient_name': _nameController.text.trim(),
      'phone': '+91${_phoneController.text.trim()}',
      'age': int.tryParse(_ageController.text) ?? 0,
      'gender': _selectedGender,
      'specialty': _selectedSpecialty,
      'procedure_interest': _procedureController.text.trim(),
      'medical_history': _medicalHistoryController.text.trim(),
      'city': _selectedCity,
      'budget_range': _selectedBudget,
      'insurance': _hasInsurance,
      'insurance_provider': _hasInsurance ? _insuranceProviderController.text.trim() : null,
      'urgency': _selectedUrgency,
      'notes': _notesController.text.trim(),
    };

    final success = await ref.read(patientsProvider.notifier).addPatient(formData);
    setState(() => _isLoading = false);

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Row(
            children: [
              Icon(Icons.check_circle, color: Colors.white),
              SizedBox(width: 8),
              Text(AppStrings.leadSubmitted),
            ],
          ),
          backgroundColor: AppColors.secondary,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        ),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Add New Patient'),
        leading: IconButton(
          icon: const Icon(Icons.close),
          onPressed: () => context.pop(),
        ),
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepTapped: (step) => setState(() => _currentStep = step),
          onStepContinue: () {
            if (_currentStep < 2) {
              setState(() => _currentStep++);
            } else {
              _submit();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) setState(() => _currentStep--);
          },
          controlsBuilder: (context, details) {
            return Padding(
              padding: const EdgeInsets.only(top: 20),
              child: Row(
                children: [
                  Expanded(
                    child: CustomButton(
                      label: _currentStep < 2 ? 'Next' : 'Submit Lead',
                      onPressed: details.onStepContinue,
                      isLoading: _isLoading && _currentStep == 2,
                      icon: _currentStep < 2 ? Icons.arrow_forward : Icons.send,
                    ),
                  ),
                  if (_currentStep > 0) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: CustomButton(
                        label: 'Back',
                        onPressed: details.onStepCancel,
                        isOutlined: true,
                      ),
                    ),
                  ],
                ],
              ),
            );
          },
          steps: [
            Step(
              title: const Text('Basic Info', style: TextStyle(fontFamily: 'Poppins')),
              subtitle: const Text('Name, phone, age, gender'),
              isActive: _currentStep >= 0,
              state: _currentStep > 0 ? StepState.complete : StepState.indexed,
              content: _buildBasicInfo(),
            ),
            Step(
              title: const Text('Medical Details', style: TextStyle(fontFamily: 'Poppins')),
              subtitle: const Text('Specialty, procedure'),
              isActive: _currentStep >= 1,
              state: _currentStep > 1 ? StepState.complete : StepState.indexed,
              content: _buildMedicalDetails(),
            ),
            Step(
              title: const Text('Financial & Other', style: TextStyle(fontFamily: 'Poppins')),
              subtitle: const Text('Budget, insurance, notes'),
              isActive: _currentStep >= 2,
              content: _buildFinancialDetails(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBasicInfo() {
    return Column(
      children: [
        _FormField(
          label: 'Patient Full Name *',
          child: TextFormField(
            controller: _nameController,
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              hintText: 'e.g. Ramesh Kumar',
              prefixIcon: Icon(Icons.person_outline),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return AppStrings.requiredField;
              if (v.length < 3) return AppStrings.minChars;
              return null;
            },
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Phone Number *',
          child: TextFormField(
            controller: _phoneController,
            keyboardType: TextInputType.phone,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(10),
            ],
            decoration: const InputDecoration(
              hintText: '98765 43210',
              prefixText: '+91  ',
              prefixIcon: Icon(Icons.phone_outlined),
            ),
            validator: (v) {
              if (v == null || v.isEmpty) return AppStrings.requiredField;
              if (v.length != 10) return AppStrings.invalidPhone;
              return null;
            },
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              flex: 2,
              child: _FormField(
                label: 'Age *',
                child: TextFormField(
                  controller: _ageController,
                  keyboardType: TextInputType.number,
                  inputFormatters: [
                    FilteringTextInputFormatter.digitsOnly,
                    LengthLimitingTextInputFormatter(3),
                  ],
                  decoration: const InputDecoration(
                    hintText: 'e.g. 45',
                    prefixIcon: Icon(Icons.cake_outlined),
                  ),
                  validator: (v) {
                    if (v == null || v.isEmpty) return AppStrings.requiredField;
                    final age = int.tryParse(v);
                    if (age == null || age < 1 || age > 120) {
                      return AppStrings.invalidAge;
                    }
                    return null;
                  },
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              flex: 3,
              child: _FormField(
                label: 'Gender *',
                child: DropdownButtonFormField<String>(
                  value: _selectedGender,
                  decoration: const InputDecoration(
                    prefixIcon: Icon(Icons.wc_outlined),
                  ),
                  hint: const Text('Select'),
                  items: const [
                    DropdownMenuItem(value: 'M', child: Text('Male')),
                    DropdownMenuItem(value: 'F', child: Text('Female')),
                    DropdownMenuItem(value: 'O', child: Text('Other')),
                  ],
                  onChanged: (v) => setState(() => _selectedGender = v),
                  validator: (v) => v == null ? AppStrings.requiredField : null,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMedicalDetails() {
    return Column(
      children: [
        _FormField(
          label: 'Specialty *',
          child: DropdownButtonFormField<String>(
            value: _selectedSpecialty,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.medical_information_outlined),
            ),
            hint: const Text('Select specialty'),
            isExpanded: true,
            items: _specialties
                .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                .toList(),
            onChanged: (v) => setState(() => _selectedSpecialty = v),
            validator: (v) => v == null ? AppStrings.requiredField : null,
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Procedure Interest',
          child: TextFormField(
            controller: _procedureController,
            maxLines: 2,
            decoration: const InputDecoration(
              hintText: 'e.g. Knee Replacement, Gallbladder removal...',
              prefixIcon: Icon(Icons.healing_outlined),
              alignLabelWithHint: true,
            ),
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'City *',
          child: DropdownButtonFormField<String>(
            value: _selectedCity,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.location_city_outlined),
            ),
            hint: const Text('Select city'),
            isExpanded: true,
            items: _cities
                .map((c) => DropdownMenuItem(value: c, child: Text(c)))
                .toList(),
            onChanged: (v) => setState(() => _selectedCity = v),
            validator: (v) => v == null ? AppStrings.requiredField : null,
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Medical History',
          child: TextFormField(
            controller: _medicalHistoryController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Diabetes, hypertension, previous surgeries...',
              alignLabelWithHint: true,
            ),
          ),
        ),
        const SizedBox(height: 16),
        _FormField(
          label: 'Urgency *',
          child: DropdownButtonFormField<String>(
            value: _selectedUrgency,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.timer_outlined),
            ),
            hint: const Text('Select urgency'),
            isExpanded: true,
            items: _urgencies
                .map((u) => DropdownMenuItem(value: u, child: Text(u)))
                .toList(),
            onChanged: (v) => setState(() => _selectedUrgency = v),
            validator: (v) => v == null ? AppStrings.requiredField : null,
          ),
        ),
      ],
    );
  }

  Widget _buildFinancialDetails() {
    return Column(
      children: [
        _FormField(
          label: 'Budget Range',
          child: DropdownButtonFormField<String>(
            value: _selectedBudget,
            decoration: const InputDecoration(
              prefixIcon: Icon(Icons.account_balance_wallet_outlined),
            ),
            hint: const Text('Select budget'),
            isExpanded: true,
            items: _budgets
                .map((b) => DropdownMenuItem(value: b, child: Text(b)))
                .toList(),
            onChanged: (v) => setState(() => _selectedBudget = v),
          ),
        ),
        const SizedBox(height: 16),

        // Insurance Toggle
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            children: [
              const Icon(Icons.health_and_safety_outlined, color: AppColors.primary),
              const SizedBox(width: 12),
              const Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Has Insurance?',
                        style: TextStyle(fontWeight: FontWeight.w500)),
                    Text('Toggle if patient has insurance coverage',
                        style: TextStyle(fontSize: 12, color: AppColors.textHint)),
                  ],
                ),
              ),
              Switch(
                value: _hasInsurance,
                onChanged: (v) => setState(() => _hasInsurance = v),
                activeColor: AppColors.primary,
              ),
            ],
          ),
        ),

        if (_hasInsurance) ...[
          const SizedBox(height: 16),
          _FormField(
            label: 'Insurance Provider',
            child: TextFormField(
              controller: _insuranceProviderController,
              decoration: const InputDecoration(
                hintText: 'e.g. Star Health, HDFC ERGO...',
                prefixIcon: Icon(Icons.business_outlined),
              ),
            ),
          ),
        ],

        const SizedBox(height: 16),
        _FormField(
          label: 'Additional Notes',
          child: TextFormField(
            controller: _notesController,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Any special requirements or information...',
              alignLabelWithHint: true,
            ),
          ),
        ),
        const SizedBox(height: 12),

        // Info card
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: AppColors.primary.withOpacity(0.06),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Icon(Icons.info_outline, color: AppColors.primary, size: 18),
              const SizedBox(width: 8),
              const Expanded(
                child: Text(
                  'After submission, our medical team will contact the patient within 24 hours to schedule consultation.',
                  style: TextStyle(fontSize: 12, color: AppColors.primary),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _FormField extends StatelessWidget {
  final String label;
  final Widget child;

  const _FormField({required this.label, required this.child});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: AppColors.textPrimary,
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}
