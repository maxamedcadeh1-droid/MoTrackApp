// EXAMPLE: How to Update Habits.tsx to Use New Modal System
// This shows the pattern for converting existing modals to the new architecture

import { useModal, Modal, ModalBody, ModalFooter } from '../../components/ui/Layout';

// OLD PATTERN (BEFORE):
// const [isAdding, setIsAdding] = useState(false);
// const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
// 
// // Modal was rendered conditionally:
// if (isAdding) return <AddHabitForm onClose={() => setIsAdding(false)} />;

// NEW PATTERN (AFTER):

export function HabitsExample() {
  // Single hook for modal state - no useState needed
  const { isOpen, open, close } = useModal('add-habit-modal');
  const { isOpen: isEditOpen, open: openEdit, close: closeEdit } = useModal('edit-habit-modal');

  const [selectedHabit, setSelectedHabit] = useState<Habit | null>(null);
  const [newHabit, setNewHabit] = useState({ 
    title: '', 
    description: '',
    category: 'Health', 
    color: '#8b5cf6', 
    icon: 'target' 
  });
  const [submitting, setSubmitting] = useState(false);

  const handleAddClick = () => {
    setNewHabit({ title: '', description: '', category: 'Health', color: '#8b5cf6', icon: 'target' });
    open(); // Opens modal
  };

  const handleEditClick = (habit: Habit) => {
    setSelectedHabit(habit);
    setNewHabit({
      title: habit.title,
      description: habit.description || '',
      category: habit.category || 'Health',
      color: habit.color || '#8b5cf6',
      icon: habit.icon || 'target'
    });
    openEdit(); // Opens modal
  };

  const handleCloseModal = () => {
    close();
    setNewHabit({ title: '', description: '', category: 'Health', color: '#8b5cf6', icon: 'target' });
  };

  const handleCloseEditModal = () => {
    closeEdit();
    setSelectedHabit(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // ... existing submit logic ...
      if (selectedHabit) {
        // Update logic
        handleCloseEditModal();
      } else {
        // Create logic
        handleCloseModal();
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {/* Existing habit list UI */}
      <button onClick={handleAddClick}>Add Habit</button>

      {/* Habit list items */}
      {habits.map(habit => (
        <div key={habit.id} onClick={() => handleEditClick(habit)}>
          {habit.title}
        </div>
      ))}

      {/* ── ADD HABIT MODAL ── */}
      <Modal 
        id="add-habit-modal" 
        title="Create New Habit"
        onClose={handleCloseModal}
      >
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Title Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Habit Name
              </label>
              <input
                type="text"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                placeholder="e.g., Morning meditation"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Description
              </label>
              <textarea
                value={newHabit.description}
                onChange={(e) => setNewHabit({ ...newHabit, description: e.target.value })}
                placeholder="Why is this habit important?"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </div>

            {/* Category Select */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Category
              </label>
              <select
                value={newHabit.category}
                onChange={(e) => setNewHabit({ ...newHabit, category: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Color Picker */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Color
              </label>
              <div className="flex gap-2">
                {COLORS.map(color => (
                  <button
                    key={color}
                    onClick={() => setNewHabit({ ...newHabit, color })}
                    className={cn(
                      'h-8 w-8 rounded-full border-2 transition-all',
                      newHabit.color === color ? 'border-white scale-110' : 'border-white/20'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Icon Picker */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Icon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {ICONS.map(({ name, icon: Icon }) => (
                  <button
                    key={name}
                    onClick={() => setNewHabit({ ...newHabit, icon: name })}
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg border transition-all',
                      newHabit.icon === name 
                        ? 'border-accent bg-accent/10' 
                        : 'border-white/10 hover:border-white/20'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </button>
                ))}
              </div>
            </div>
          </form>
        </ModalBody>

        {/* Footer with Actions - Always Visible, Safe-Area Aware */}
        <ModalFooter>
          <button
            onClick={handleCloseModal}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !newHabit.title.trim()}
            className="flex-1 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Creating...' : 'Create Habit'}
          </button>
        </ModalFooter>
      </Modal>

      {/* ── EDIT HABIT MODAL ── */}
      <Modal 
        id="edit-habit-modal" 
        title="Edit Habit"
        onClose={handleCloseEditModal}
      >
        <ModalBody>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Same form fields as above */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Habit Name
              </label>
              <input
                type="text"
                value={newHabit.title}
                onChange={(e) => setNewHabit({ ...newHabit, title: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white"
              />
            </div>
            {/* ... more fields ... */}
          </form>
        </ModalBody>

        <ModalFooter>
          <button
            onClick={handleCloseEditModal}
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 font-semibold text-white hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 rounded-xl border border-violet-500/30 bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-3 font-semibold text-white disabled:opacity-50"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

// KEY DIFFERENCES FROM OLD PATTERN:

// 1. Modal State Management
// OLD: useState for isAdding, editingHabit, etc.
// NEW: useModal('modal-id') hook manages all state

// 2. Modal Rendering
// OLD: if (isAdding) return <AddHabitForm />
// NEW: <Modal id="..." /> always in JSX, visibility managed by hook

// 3. Modal Structure
// OLD: Custom modal component with custom styling
// NEW: Standard Modal + ModalBody + ModalFooter components

// 4. Footer Actions
// OLD: Could disappear below mobile nav
// NEW: Sticky footer with safe-area-aware padding, always visible

// 5. Multiple Modals
// OLD: Need separate state for each modal
// NEW: Multiple useModal() hooks, each with unique ID

// 6. Modal Closing
// OLD: onClose callback to parent
// NEW: Built-in close() function from useModal hook

// 7. Mobile Experience
// OLD: May clip or overlap with nav
// NEW: Fullscreen sheet on mobile, centered on desktop, perfect UX

// TESTING MOBILE:
// 1. Open modal on iPhone (slides up from bottom)
// 2. Try to tap outside modal (overlay closes it)
// 3. Press Escape key (modal closes)
// 4. Try to scroll background (scroll lock prevents it)
// 5. Scroll modal content (independent scroll)
// 6. Check footer buttons (always visible above safe area)
// 7. Check on device with notch (content respects safe area)
