import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme/app_colors.dart';
import '../widgets/dotted_background.dart';
import '../providers/board_provider.dart';
import '../widgets/board_card_widget.dart';
import '../dialogs/create_board_dialog.dart';
import '../dialogs/join_board_dialog.dart';


class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => BoardProvider(),
      child: const _DashboardView(),
    );
  }
}

class _DashboardView extends StatefulWidget {
  const _DashboardView();

  @override
  State<_DashboardView> createState() => _DashboardViewState();
}

class _DashboardViewState extends State<_DashboardView> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<BoardProvider>().fetchBoards();
    });
  }

  Future<void> _openCreateBoardDialog() async {
    await showCreateBoardDialog(context, context.read<BoardProvider>());
  }

  Future<void> _onEnterCode() async {
    await showJoinBoardDialog(context);
  }

  Future<void> _logout() async {
    try {
      await context.read<BoardProvider>().logout();
      if (mounted) {
        Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Logout failed. Please try again.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        automaticallyImplyLeading: false,
        title: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Image.asset('assets/logo.png', height: 50),
            const SizedBox(width: 8),
            Text(
              'Ink Dashboard',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Log out',
            icon: const Icon(Icons.logout),
            color: AppColors.accent,
            onPressed: _logout,
          ),
          const SizedBox(width: 8),
        ],
      ),

      body: DottedBackground(
        child: Column(
          children: [
            Expanded(
              child: _BoardListArea(
                onRefresh: () => context.read<BoardProvider>().fetchBoards(),
              ),
            ),
            _BottomBar(
              onEnterCode: _onEnterCode,
              onCreateBoard: _openCreateBoardDialog,
            ),
          ],
        ),
      ),
    );
  }
}

class _BoardListArea extends StatelessWidget {
  final Future<void> Function() onRefresh;

  const _BoardListArea({required this.onRefresh});

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<BoardProvider>();

    if (provider.isLoading) {
      return const Center(
        child: CircularProgressIndicator(
          color: AppColors.accent,
          strokeWidth: 2,
        ),
      );
    }

    if (provider.error != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                provider.error!,
                textAlign: TextAlign.center,
                style: Theme.of(context)
                    .textTheme
                    .bodyMedium
                    ?.copyWith(color: AppColors.textMuted),
              ),
              const SizedBox(height: 16),
              OutlinedButton(
                onPressed: onRefresh,
                child: const Text('Try again'),
              ),
            ],
          ),
        ),
      );
    }

    if (provider.boards.isEmpty) {
      return const _EmptyState();
    }

    return RefreshIndicator(
      color: AppColors.accent,
      onRefresh: onRefresh,
      child: ListView.separated(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 16),
        itemCount: provider.boards.length,
        separatorBuilder: (_, __) => const SizedBox(height: 10),
        itemBuilder: (context, index) => BoardCardWidget(
          board: provider.boards[index],
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: AppColors.accent.withOpacity(0.35),
                width: 1.5,
              ),
            ),
            child: Icon(
              Icons.add,
              color: AppColors.accent.withOpacity(0.4),
              size: 24,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'No boards yet.',
            style: Theme.of(context)
                .textTheme
                .bodyMedium
                ?.copyWith(color: AppColors.textMuted),
          ),
          const SizedBox(height: 4),
          Text(
            'Create one or enter a code.',
            style: Theme.of(context).textTheme.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _BottomBar extends StatelessWidget {
  final VoidCallback onEnterCode;
  final VoidCallback onCreateBoard;

  const _BottomBar({required this.onEnterCode, required this.onCreateBoard});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.background,
        border: Border(top: BorderSide(color: AppColors.border)),
      ),
      padding: EdgeInsets.fromLTRB(
        16,
        12,
        16,
        12 + MediaQuery.of(context).padding.bottom,
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: onEnterCode,
              child: const Text('Enter Code'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: FilledButton(
              onPressed: onCreateBoard,
              child: const Text('Create Board'),
            ),
          ),
        ],
      ),
    );
  }
}
