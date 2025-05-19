from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import AiAssistant
from .forms import AiAssistantForm

# Create your views here.

@login_required
def ai_assistant_list(request):
    interactions = AiAssistant.objects.filter(user=request.user).order_by('-created_at')
    return render(request, 'aiassistant/interaction_list.html', {'interactions': interactions})

@login_required
def ai_assistant_create(request):
    if request.method == 'POST':
        form = AiAssistantForm(user=request.user, data=request.POST)
        if form.is_valid():
            interaction = form.save(commit=False)
            interaction.user = request.user
            # TODO: Implement actual AI processing here
            interaction.ai_response = "This is a placeholder response. AI processing will be implemented soon."
            interaction.save()
            messages.success(request, 'AI request processed successfully!')
            return redirect('aiassistant:interaction_list')
    else:
        form = AiAssistantForm(user=request.user)
    return render(request, 'aiassistant/interaction_form.html', {'form': form})

@login_required
def ai_assistant_detail(request, pk):
    interaction = get_object_or_404(AiAssistant, pk=pk, user=request.user)
    return render(request, 'aiassistant/interaction_detail.html', {'interaction': interaction})

@login_required
def ai_assistant_delete(request, pk):
    interaction = get_object_or_404(AiAssistant, pk=pk, user=request.user)
    if request.method == 'POST':
        interaction.delete()
        messages.success(request, 'AI interaction deleted successfully!')
        return redirect('aiassistant:interaction_list')
    return render(request, 'aiassistant/interaction_confirm_delete.html', {'interaction': interaction})
