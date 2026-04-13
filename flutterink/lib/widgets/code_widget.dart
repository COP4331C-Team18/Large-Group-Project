import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

enum CodeInputMode { numbersOnly, alphanumeric }

class CodeInput extends StatefulWidget {
  final int length;
  final ValueChanged<String> onCompleted;
  final ValueChanged<String>? onChanged;
  final CodeInputMode inputMode;

  const CodeInput({
    super.key,
    this.length = 6,
    required this.onCompleted,
    this.onChanged,
    this.inputMode = CodeInputMode.numbersOnly,
  });

  @override
  State<CodeInput> createState() => CodeInputState();
}

class CodeInputState extends State<CodeInput> {
  late final List<TextEditingController> _controllers;
  late final List<FocusNode> _focusNodes;

  @override
  void initState() {
    super.initState();
    _controllers = List.generate(widget.length, (_) => TextEditingController());
    _focusNodes = List.generate(widget.length, (_) => FocusNode());
  }

  @override
  void dispose() {
    for (var c in _controllers) c.dispose();
    for (var f in _focusNodes) f.dispose();
    super.dispose();
  }

  String get _fullCode => _controllers.map((c) => c.text).join();

  void _onChanged(int index, String value) {
    // Handle full paste
    if (value.length == widget.length) {
      for (int i = 0; i < widget.length; i++) {
        _controllers[i].text = value[i];
      }
      _focusNodes[widget.length - 1].requestFocus();
      widget.onChanged?.call(_fullCode);
      if (_fullCode.length == widget.length) widget.onCompleted(_fullCode);
      return;
    }

    if (value.length == 1 && index < widget.length - 1) {
      _focusNodes[index + 1].requestFocus();
    }

    widget.onChanged?.call(_fullCode);
    if (_fullCode.length == widget.length) widget.onCompleted(_fullCode);
  }

  void _onKeyEvent(int index, KeyEvent event) {
    if (event is KeyDownEvent &&
        event.logicalKey == LogicalKeyboardKey.backspace &&
        _controllers[index].text.isEmpty &&
        index > 0) {
      _focusNodes[index - 1].requestFocus();
      _controllers[index - 1].clear();
    }
  }

  void clear() {
    for (var c in _controllers) c.clear();
    _focusNodes[0].requestFocus();
  }

  @override
  Widget build(BuildContext context) {
    final isAlphanumeric = widget.inputMode == CodeInputMode.alphanumeric; 

    return Row(
      children: List.generate(widget.length, (index) {
        return Expanded(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 3),
            child: SizedBox(
              height: 58,
              child: KeyboardListener(
                focusNode: FocusNode(),
                onKeyEvent: (event) => _onKeyEvent(index, event),
                child: TextFormField(
                  controller: _controllers[index],
                  focusNode: _focusNodes[index],
                  textAlign: TextAlign.center,
                  keyboardType: isAlphanumeric  
                      ? TextInputType.text
                      : TextInputType.number,
                  textCapitalization: isAlphanumeric  
                      ? TextCapitalization.characters
                      : TextCapitalization.none,
                  inputFormatters: [
                    FilteringTextInputFormatter.allow( 
                      isAlphanumeric ? RegExp(r'[a-zA-Z0-9]') : RegExp(r'[0-9]'),
                    ),
                    if (isAlphanumeric) 
                      TextInputFormatter.withFunction(
                        (oldValue, newValue) =>
                            newValue.copyWith(text: newValue.text.toUpperCase()),
                      ),
                    LengthLimitingTextInputFormatter(widget.length),
                  ],
                  decoration: const InputDecoration(
                    counterText: '',
                    contentPadding: EdgeInsets.zero,
                  ),
                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                    fontSize: 20,
                    fontWeight: FontWeight.w800,
                  ),
                  onChanged: (value) => _onChanged(index, value),
                ),
              ),
            ),
          ),
        );
      }),
    );
  }
}